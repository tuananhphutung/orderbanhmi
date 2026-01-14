
import { initializeApp } from 'firebase/app';
// Use getFirestore as the more standard way to initialize Firestore in modular SDK
import { getFirestore } from 'firebase/firestore';

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
const app = initializeApp(firebaseConfig);

/**
 * CẬP NHẬT: Sử dụng getFirestore thay vì initializeFirestore để tối ưu hóa khả năng tương thích.
 */
const db = getFirestore(app);

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
