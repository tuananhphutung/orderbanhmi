
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

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

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

/**
 * SỬA LỖI: Firestore INTERNAL ASSERTION FAILED
 * Sử dụng getFirestore mặc định thay vì initializeFirestore với cấu hình cache phức tạp 
 * giúp giảm thiểu các lỗi logic nội bộ của SDK khi quản lý tab.
 */
const db = getFirestore(app);

/**
 * Kích hoạt Persistence (Lưu trữ ngoại tuyến)
 * Sử dụng forceOwnership: true để instance hiện tại chiếm quyền ghi vào IndexedDB.
 * Điều này đặc biệt quan trọng trên Mobile và PWA để tránh lỗi "Unexpected state".
 */
enableIndexedDbPersistence(db, { forceOwnership: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Nhiều tab đang mở, chỉ 1 tab được phép giữ quyền persistence
        console.warn('Firestore Persistence: Đang có tab khác hoạt động.');
    } else if (err.code === 'unimplemented') {
        // Trình duyệt không hỗ trợ
        console.warn('Firestore Persistence: Không được hỗ trợ trên trình duyệt này.');
    } else {
        console.error('Firestore Persistence Error:', err);
    }
});

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
