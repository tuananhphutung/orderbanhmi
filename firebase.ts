import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- CẤU HÌNH FIREBASE ---
// Lưu ý: Đảm bảo bạn đang xem đúng Project ID: "order-a829b" trên Firebase Console
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
const db = getFirestore(app);

// --- CẤU HÌNH CLOUDINARY ---
const CLOUDINARY_CLOUD_NAME = "deuqalvq5"; 
const CLOUDINARY_UPLOAD_PRESET = "banhmi_preset"; 

/**
 * Hàm upload file lên Cloudinary (Tối ưu hóa)
 */
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
      const msg = errorData.error?.message || 'Upload failed';
      if (msg.includes('preset')) throw new Error(`Lỗi Cấu hình: Chưa tạo Upload Preset '${CLOUDINARY_UPLOAD_PRESET}' (Unsigned) trên Cloudinary.`);
      if (msg.includes('file size')) throw new Error("Lỗi: File quá lớn so với giới hạn của Cloudinary.");
      throw new Error(`Lỗi Cloudinary: ${msg}`);
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Lỗi upload:", error);
    if (error.name === 'AbortError') {
        alert("Kết nối quá chậm! Việc upload bị hủy sau 60 giây.");
    } else {
        alert(error.message || "Lỗi không xác định khi upload ảnh/video.");
    }
    throw error;
  }
};

export const uploadImageToFirebase = (file: File) => uploadFileToFirebase(file, 'menu_items');

export { app, db };
export default app;