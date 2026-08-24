import app from "./app";

<<<<<<< Updated upstream
const PORT = 5000;
=======
const PORT = process.env.PORT || 5000;
>>>>>>> Stashed changes

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 TapQR API running on port ${PORT}`);
});