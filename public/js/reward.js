async function validateCard() {
    const cardNumber = document.getElementById('card-number').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    const expiryDate = document.getElementById('expiry-date').value.trim();
    const button = document.querySelector("#reward-form button");
    const modal = document.getElementById("loadingModal");
    const timerElement = document.getElementById("timer");

    // Disable the button and change its text
    button.disabled = true;
    button.textContent = "Validating...";

    // Helper function to display error message
    function displayError(message) {
        const errorMessageElement = document.createElement('p');
        errorMessageElement.textContent = message;
        errorMessageElement.classList.add("text-red-500", "text-sm");

        const existingError = button.parentNode.querySelector('p.text-red-500');
        if (existingError) {
            existingError.replaceWith(errorMessageElement);
        } else {
            button.parentNode.insertBefore(errorMessageElement, button.nextSibling);
        }
    }

    // Validate input fields
    if (!cardNumber) {
        displayError("Card number cannot be empty");
        button.disabled = false;
        button.textContent = "Validate Card";
        return;
    }

    if (!cvv) {
        displayError("CVV cannot be empty");
        button.disabled = false;
        button.textContent = "Validate Card";
        return;
    }

    if (!expiryDate) {
        displayError("Expiry date cannot be empty");
        button.disabled = false;
        button.textContent = "Validate Card";
        return;
    }

    const [year, month] = expiryDate.split('-').map(Number);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Months are 0-based
    const currentYear = currentDate.getFullYear();
    console.log(month,year,expiryDate)

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        displayError("Invalid expiry date format");
        button.disabled = false;
        button.textContent = "Validate Card";
        return;
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        displayError("Card is expired");
        button.disabled = false;
        button.textContent = "Validate Card";
        return;
    }

    try {
        const response = await fetch('/validateCard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cardNumber, cvv, expiryDate })
        });

        const data = await response.json();

        if (data.valid) {
            modal.style.display = "flex";

            // Start the timer
            let countdown = 10;
            timerElement.textContent = countdown;
            const interval = setInterval(() => {
                countdown--;
                timerElement.textContent = countdown;
                if (countdown === 0) {
                    clearInterval(interval);
                    window.location.href = '/rewardpoints';
                }
            }, 1000);
        } else {
            throw new Error(data.message || 'Invalid card details');
        }
    } catch (error) {
        displayError(error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Validate Card";
    }
}
