// src/services/firebaseService.js  (or your existing file)

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig.js";

/* -------------------------------------------------------------------------- */
/* 🧭 COMMITTEE MEMBERS FUNCTIONS */
/* -------------------------------------------------------------------------- */

// 🔄 Listen for realtime updates of committee members
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

/* -------------------------------------------------------------------------- */
/* 📅 EVENTS FUNCTIONS (NEW) */
/* -------------------------------------------------------------------------- */

// 🔄 Listen to all events (realtime)
export const listenToEvents = (callback) => {
  const q = query(collection(db, "events"), orderBy("date", "asc"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(events);
  });
  return unsubscribe;
};

// 🟢 Fetch all events (non-realtime, one-time)
export const getAllEvents = async () => {
  const snapshot = await getDocs(collection(db, "events"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ➕ Add new event (admin only)
export const addEvent = async (event) => {
  await addDoc(collection(db, "events"), {
    ...event,
    createdAt: new Date().toISOString(),
  });
};

// ✏️ Update event
export const updateEvent = async (id, data) => {
  await updateDoc(doc(db, "events", id), data);
};

// ❌ Delete event
export const deleteEvent = async (id) => {
  await deleteDoc(doc(db, "events", id));
};
