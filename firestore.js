import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// 🔄 Listen for realtime updates
export const listenToCommittee = (callback) => {
  const unsubscribe = onSnapshot(
    collection(db, "committeeMembers"),
    (snapshot) => {
      const members = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(members);
    }
  );
  return unsubscribe;
};

// ➕ Add new member
export const addMember = async (member) => {
  await addDoc(collection(db, "committeeMembers"), member);
};

// ✏️ Update member
export const updateMember = async (id, data) => {
  await updateDoc(doc(db, "committeeMembers", id), data);
};

// ❌ Delete member
export const deleteMember = async (id) => {
  await deleteDoc(doc(db, "committeeMembers", id));
};
