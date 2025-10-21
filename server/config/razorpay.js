import Razorpay from "razorpay";

let razorpay;

if (process.env.NODE_ENV === "production") {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in production");
  }

  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("⚠️ Razorpay keys missing — running in development mode without payment integration");
  
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "dummy_key_id",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret",
  });
}

export default razorpay;
