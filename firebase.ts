
// Fix: Use compat version of Firebase for v8-style API compatibility in a v9+ environment
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// --- CẤU HÌNH FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDlnHfLcp8Cao0GuThmt7zqGxGaOPuwHDI",
  authDomain: "order-a829b.firebaseapp.com",
  databaseURL: "https://order-a829b-default-rtdb.firebaseio.com",
  projectId: "order-a829b",
  storageBucket: "order-a829b.firebasestorage.app",
  messagingSenderId: "412428650270",
  appId: "1:412428650270:web:ec87c5d7aaeb8931b7eb0f",
  measurementId: "G-XVDW40LCGZ"
};

// Khởi tạo Firebase
// Fix: Use compat initializeApp to resolve property missing error on modular SDK
const app = firebase.initializeApp(firebaseConfig);

/**
 * CẬP NHẬT: Sử dụng firebase.firestore() cho khả năng tương thích với môi trường hiện tại.
 * Fix: Use compat firestore to resolve property missing error on modular SDK
 */
const db = firebase.firestore();

// --- CẤU HÌNH CLOUDINARY ---
const CLOUDINARY_CLOUD_NAME = "deuqalvq5"; 
const CLOUDINARY_UPLOAD_PRESET = "banhmi_preset"; 

export const uploadFileToFirebase = async (file: File, folder: string = 'uploads'): Promise<string> => {
  if (!file) throw new Error("Chưa chọn file");

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); 
  formData.append('folder', folder);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal 
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Lỗi upload:", error);
    if (error.name === 'AbortError') {
        alert("Mạng quá yếu, không thể tải ảnh lên.");
    } else {
        alert("Lỗi upload ảnh: " + (error.message || "Không xác định"));
    }
    throw error;
  }
};

export { app, db };
export default app;
