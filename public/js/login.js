function validateName(name) {
    return /^[A-Za-z\s]+$/.test(name);
}

function validateDOB(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 18 && age <= 120 && birthDate <= today;
}

function validatePAN(pan) {
    const panPattern = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    return panPattern.test(pan);
}




//Real-time Validation
const inputs = document.querySelectorAll("#login-form input");
inputs.forEach(input => {
    input.addEventListener('input', validateInput);
});

function validateInput(event) {
    const input = event.target;
    const errorId = input.id + "Error";
    const errorElement = document.getElementById(errorId);

    switch (input.id) {
        case 'name':
            errorElement.textContent = validateName(input.value) ? "" : "Name must contain only alphabets";
            break;
        case 'dob':
            errorElement.textContent = validateDOB(input.value) ? "" : "Invalid DOB (age 18-120, no future dates)";
            break;
        case 'pan':
            errorElement.textContent = validatePAN(input.value) ? "" : "Invalid PAN format (e.g., ABCDE1234F)";
            break;
        case 'phoneNumber':
            errorElement.textContent = input.value.length < 10 ? "Mobile number must be at least 10 digits" : "";
            break;
    }
}






function showOTPForm(phoneNumber) {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('otp-form').style.display = 'block';

            // Clear any existing elements
            const existingPhoneDisplay = document.getElementById('otp-form').querySelector('p');
            const existingChangeNumberButton = document.getElementById('otp-form').querySelector('button.change-number'); 
            const existingVerifyButton = document.getElementById('otp-form').querySelector('button.verify-otp');

                if (existingPhoneDisplay) {
                    existingPhoneDisplay.remove();
                }
                if (existingChangeNumberButton) {
                    existingChangeNumberButton.remove();
                }
                if (existingVerifyButton) existingVerifyButton.remove();
                // Display Phone Number
            const phoneDisplay = document.createElement('p');
                phoneDisplay.id = "phone-display";
                phoneDisplay.textContent = `OTP sent to: ${phoneNumber}`;
            phoneDisplay.classList.add("text-gray-700", "mb-2");
            document.getElementById('otp-form').insertBefore(phoneDisplay, document.getElementById('otp-form').firstChild);
            
            // Change Number Button
                const changeNumberButton = document.createElement('button');
                changeNumberButton.textContent = "Change Number";
                changeNumberButton.classList.add("change-number", "bg-gray-300", "hover:bg-gray-400", "text-gray-800", "font-bold", "py-2", "px-4", "rounded", "mb-4");
                changeNumberButton.addEventListener('click', () => {
                    document.getElementById('otp-form').style.display = 'none';
                    document.getElementById('login-form').style.display = 'block';
                });
            document.getElementById('otp-form').insertBefore(changeNumberButton, document.getElementById('otp-form').firstChild);
            }

        

async function sendOTP() {
  const name = document.getElementById('name').value.trim();
  const dob = document.getElementById('dob').value.trim();
  const code = document.getElementById('countryCode').value;
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const pan = document.getElementById('pan').value.trim();
  const phone = code + phoneNumber;

  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach(el => el.textContent = "");

  const button = document.querySelector("#login-form button");
  const form = document.getElementById('login-form');

  // Clear any existing error messages
  const existingError = form.querySelector('.text-red-500');
  if (existingError) {
      existingError.remove();
  }

  // Validate input fields
  if (!name || !dob || !phoneNumber || !pan) {
      displayError('All fields are required');
       return;
   }
 
   if (!validateName(name)) {
     displayError('Name must contain only alphabets');
     return;
        }
 
   if (!validateDOB(dob)) {
     displayError('Invalid Date of Birth. Age must be between 18 and 120 years.');
     return;
        }
 
 if (phoneNumber.length < 10) {
     displayError('Mobile number must be at least 10 digits');
     return;
       }
 
 if (!validatePAN(pan)) {
     displayError('Invalid PAN number format');
     return;
       }




  if (phoneNumber.length < 10) {
      displayError('Mobile number must be at least 10 digits');
      return;
  }


  button.disabled = true;
  button.textContent = "Sending OTP...";

  try {
      const response = await fetch('/sendOTP', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (data.success) {
          console.log('OTP sent successfully');
          showOTPForm(phone);
          document.getElementById('login-form').style.display = 'none';
          document.getElementById('otp-form').style.display = 'block';
      } else {
          displayError('Failed to send OTP');
      }
  } catch (error) {
      console.error(error);
      displayError('Failed to send OTP');
  } finally {
      // Remove Loading State
      button.disabled = false;
      button.textContent = "Send OTP";
  }
}

function displayError(message) {
  const button = document.querySelector("#login-form button");
  const errorMessageElement = document.createElement('p');
  errorMessageElement.textContent = message;
  errorMessageElement.classList.add("text-red-500", "text-sm", "error-message");
  button.parentNode.insertBefore(errorMessageElement, button);
}



function verifyOTP() {
    const verifyButton = document.getElementById('verifyButton'); // Get the button element
    verifyButton.disabled = true;
    verifyButton.textContent = 'Verifying...';
    const otp = document.getElementById('otp').value;
    const code = document.getElementById('countryCode').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const phone =  code+phoneNumber
    // console.log(otp,code,phone)

    const userData = {
        name: document.getElementById('name').value,
        dob: document.getElementById('dob').value,
        phone: phone,
        pan: document.getElementById('pan').value
    };

    fetch('/verifyOTP', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, otp,userData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('token', data.token);
            window.location.href = '/reward';
        } else {
            verifyButton.disabled = false;
            verifyButton.textContent = 'Verify';
            let errorElement = document.getElementById('otpError'); 
            if (!errorElement) { 
              errorElement = document.createElement('p'); 
              errorElement.id = 'otpError';  
              document.getElementById('otp').parentNode.appendChild(errorElement); 
            }
        
            // 2. Display the Error Message
            errorElement.style.color = 'red';
            errorElement.textContent = 'Invalid OTP';
        }
    });
}


function resendOTP() {
    sendOTP();

    let errorElement = document.getElementById('otpError');
    
    // Create error element only if it doesn't exist
    if (!errorElement) {
      errorElement = document.createElement('p');
      errorElement.id = 'otpError';
      const otpParent = document.getElementById('otp').parentNode;
      if (otpParent) { // Check if parent exists before appending
          otpParent.appendChild(errorElement);
      } else {
          console.error("Parent element with ID 'otp' not found.");
      }
    }

    errorElement.style.color = 'Green';
    errorElement.textContent = 'OTP sent again... ';
    
  }