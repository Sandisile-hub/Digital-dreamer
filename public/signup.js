document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    hideMessages();
    
    const formData = new FormData(this);
    
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: 'member',
        branch_id: parseInt(formData.get('branch_id')),
        is_bec_member: false,
        nec_position: 'none',
        bec_position: 'none',
        status: 'active'
    };

    fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (data.error) {
            console.log('Signup error:', data.error);
            alert('Signup failed: ' + data.error);
        } else {
            console.log('User created successfully:', data);
            window.location.href = 'gnm_dashboard.html';
        }
    })
    .catch(function(error) {
        console.log('Error:', error);
        alert('Signup failed. Please try again.');
    });
});

document.getElementById('googleSignUp').addEventListener('click', function() {
    hideMessages();
    console.log('Google Sign Up clicked - redirecting to dashboard');
    window.location.href = 'gnm_dashboard.html';
});

function hideMessages() {
    document.getElementById('successMessage').classList.add('hidden');
}

const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');

togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    if (type === 'text') {
        eyeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-1.414-1.414M14.12 14.12l1.414 1.414M14.12 14.12L15.535 15.535M14.12 14.12l-4.243-4.243m5.657-5.657l-1.414 1.414"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 15l6-6m0 0l-6-6m6 6H9"></path>';
    } else {
        eyeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
    }
});

const inputs = document.querySelectorAll('input, select');
inputs.forEach(function(input) {
    input.addEventListener('blur', function() {
        if (this.checkValidity()) {
            this.classList.remove('border-red-300');
            this.classList.add('border-gray-300');
        } else {
            this.classList.remove('border-gray-300');
            this.classList.add('border-red-300');
        }
    });
    
    input.addEventListener('input', hideMessages);
});