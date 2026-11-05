import nodemailer from "nodemailer";

async function testGmail() {
  console.log("Testing with port 465, secure: true");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "luxehome.noreply@gmail.com",
      pass: "fryf sncb ccxj ddmt",
    },
  });

  try {
    await transporter.verify();
    console.log("✅ Success on 465!");
  } catch (error) {
    console.error("❌ Failed on 465:", error.message);
  }
}

testGmail();
