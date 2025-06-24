function togglePasswordVisibility(inputId, icon) {
  const passwordField = document.getElementById(inputId);
  const isPasswordVisible = passwordField.type === "text";

  // Toggle input type between password and text
  passwordField.type = isPasswordVisible ? "password" : "text";

  // Update the icon class
  icon.classList.toggle("fa-eye", isPasswordVisible);
  icon.classList.toggle("fa-eye-slash", !isPasswordVisible);
}

document.getElementById("pass-eye").addEventListener("click", function(){
  togglePasswordVisibility("input-password", this);
});
document.getElementById("pass-con-eye").addEventListener("click", function(){
  togglePasswordVisibility("con-password", this);
});
