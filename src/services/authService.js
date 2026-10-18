import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

const SUPER_ADMIN_ENV_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || '').trim().toLowerCase();

/**
 * Checks if a given email is designated as Super Admin
 */
export function isConfiguredSuperAdmin(email) {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (SUPER_ADMIN_ENV_EMAIL && clean === SUPER_ADMIN_ENV_EMAIL) return true;
  return false;
}

/**
 * Register a new user with Email, Password and Full Name.
 * The first ever registered user is automatically granted Super Admin with lifetime approval.
 * Subsequent users are set to 'pending' until the Super Admin approves them.
 */
export async function registerUser({ email, password, displayName }) {
  if (!auth || !db) {
    throw new Error('Firebase authentication is not configured yet.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (displayName || '').trim() || cleanEmail.split('@')[0];

  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;

  // 2. Update display name in Firebase Auth
  try {
    await updateProfile(user, { displayName: cleanName });
  } catch (e) {
    console.warn('Could not update profile name in Auth:', e);
  }

  // 3. Determine if this user should be Super Admin
  // If email matches configured super admin email OR if this is the first user in 'users' collection
  let isSuperAdmin = isConfiguredSuperAdmin(cleanEmail);

  if (!isSuperAdmin) {
    try {
      const q = query(collection(db, 'users'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        // First user ever gets Super Admin access automatically
        isSuperAdmin = true;
      }
    } catch (e) {
      console.warn('Could not check existing users count:', e);
    }
  }

  const status = isSuperAdmin ? 'approved' : 'pending';
  const role = isSuperAdmin ? 'superadmin' : 'user';

  // 4. Save user document in Firestore 'users/{uid}'
  const userDocRef = doc(db, 'users', user.uid);
  const userProfile = {
    uid: user.uid,
    email: cleanEmail,
    displayName: cleanName,
    status, // 'approved' | 'pending' | 'revoked'
    role, // 'superadmin' | 'admin' | 'user'
    createdAt: new Date().toISOString(),
    approvedAt: isSuperAdmin ? new Date().toISOString() : null,
    approvedBy: isSuperAdmin ? 'system' : null,
  };

  await setDoc(userDocRef, userProfile);

  return { user, profile: userProfile };
}

/**
 * Log in an existing user
 */
export async function loginUser(email, password) {
  if (!auth) {
    throw new Error('Firebase authentication is not configured yet.');
  }
  const cleanEmail = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  return credential.user;
}

/**
 * Log out current user
 */
export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Real-time listener for current authentication state and user profile.
 * Automatically updates in real time if Super Admin approves, revokes, or updates the user.
 */
export function subscribeToAuth(onAuthChange) {
  if (!auth || !db) {
    // Local fallback when Firebase is not configured
    onAuthChange({
      user: null,
      profile: null,
      isApproved: true,
      isSuperAdmin: true,
      isPending: false,
      isRevoked: false,
      loading: false,
      isLocalMode: true,
    });
    return () => {};
  }

  let unsubscribeProfile = null;

  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (unsubscribeProfile) {
      unsubscribeProfile();
      unsubscribeProfile = null;
    }

    if (!user) {
      onAuthChange({
        user: null,
        profile: null,
        isApproved: false,
        isSuperAdmin: false,
        isPending: false,
        isRevoked: false,
        loading: false,
        isLocalMode: false,
      });
      return;
    }

    // User is logged in: listen in real time to their profile in Firestore 'users/{uid}'
    const userDocRef = doc(db, 'users', user.uid);

    unsubscribeProfile = onSnapshot(
      userDocRef,
      async (docSnap) => {
        let profile = null;

        if (docSnap.exists()) {
          profile = docSnap.data();
        } else {
          // If profile doc doesn't exist yet, create it
          const isSuperAdmin = isConfiguredSuperAdmin(user.email);
          profile = {
            uid: user.uid,
            email: user.email.toLowerCase(),
            displayName: user.displayName || user.email.split('@')[0],
            status: isSuperAdmin ? 'approved' : 'pending',
            role: isSuperAdmin ? 'superadmin' : 'user',
            createdAt: new Date().toISOString(),
            approvedAt: isSuperAdmin ? new Date().toISOString() : null,
          };
          try {
            await setDoc(userDocRef, profile);
          } catch (e) {
            console.warn('Could not auto-create user profile doc:', e);
          }
        }

        const isSuperAdmin =
          profile.role === 'superadmin' || isConfiguredSuperAdmin(user.email);
        const status = isSuperAdmin ? 'approved' : profile.status || 'pending';

        onAuthChange({
          user,
          profile,
          status,
          role: profile.role || (isSuperAdmin ? 'superadmin' : 'user'),
          isApproved: status === 'approved',
          isSuperAdmin,
          isPending: status === 'pending',
          isRevoked: status === 'revoked',
          loading: false,
          isLocalMode: false,
        });
      },
      (error) => {
        console.warn('Error listening to user profile doc:', error);
        // Fallback for permission errors
        const isSuperAdmin = isConfiguredSuperAdmin(user.email);
        onAuthChange({
          user,
          profile: { email: user.email, displayName: user.displayName },
          status: isSuperAdmin ? 'approved' : 'pending',
          isApproved: isSuperAdmin,
          isSuperAdmin,
          isPending: !isSuperAdmin,
          isRevoked: false,
          loading: false,
          isLocalMode: false,
        });
      }
    );
  });

  return () => {
    if (unsubscribeProfile) unsubscribeProfile();
    unsubscribeAuth();
  };
}

/**
 * Super Admin: Listen to all registered users in real time.
 */
export function subscribeToAllUsers(onUsersList, onError) {
  if (!db) return () => {};

  const usersCol = collection(db, 'users');
  return onSnapshot(
    usersCol,
    (snapshot) => {
      const list = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      // Sort newest users first
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      onUsersList(list);
    },
    (err) => {
      console.warn('Failed to fetch all users:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Super Admin: Approve a user for lifetime access
 */
export async function approveUser(uid, approverEmail) {
  if (!db) return;
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: approverEmail || 'Super Admin',
  });
}

/**
 * Super Admin: Revoke / block access for a user anytime
 */
export async function revokeUser(uid, revokerEmail) {
  if (!db) return;
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    status: 'revoked',
    revokedAt: new Date().toISOString(),
    revokedBy: revokerEmail || 'Super Admin',
  });
}

/**
 * Super Admin: Delete user document completely from Firestore
 */
export async function deleteUserRecord(uid) {
  if (!db) return;
  const userDocRef = doc(db, 'users', uid);
  await deleteDoc(userDocRef);
}

/**
 * Super Admin: Update role (superadmin, admin, user)
 */
export async function updateUserRole(uid, role) {
  if (!db) return;
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, { role });
}
