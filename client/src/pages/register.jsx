import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Register() {
    const [registerForm, setRegisterForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    const [display, setDisplay] = useState(false);

    function displayError(error){
        return <div className="text-red-500 py-1 ">{error}</div>
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRegisterForm((prev) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(registerForm.username === '' || registerForm.email === '' || registerForm.password === '' || registerForm.confirmPassword === '') {
                setDisplay(displayError("Please fill out all fields"));
                return;
            }
            if(registerForm.password !== registerForm.confirmPassword) {
                setDisplay(displayError("Passwords do not match"));
                return;
            }
            console.log("Form submitted:", registerForm);
        } catch (error) {
            console.error("Error registering user:", error);
        }

        setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
    }

    return (
        <div className="flex flex-col items-center justify-center mt-35">
            <div className='w-full max-w-sm p-4 border border-surface-600 rounded-lg shadow-sm sm:p-6 md:p-8 bg-tonal-900'>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <h5 className="text-xl font-medium text-light">RespawnRoom // Register</h5>
                    <div>
                         <label className="block mb-2 text-sm font-medium text-light">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={registerForm.username}
                            onChange={handleChange}
                            placeholder="Username" 
                            className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-light">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={registerForm.email}
                            onChange={handleChange}
                            placeholder="Email" 
                            className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-light">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={registerForm.password}
                            onChange={handleChange}
                            placeholder="Password" 
                            className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-light">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={registerForm.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm Password" 
                            className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5"
                        />
                    </div>
                    <button type="submit" className="w-full text-white focus:ring-4 bg-primary-600 hover:bg-primary-700 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center focus:ring-primary-900">Register</button>
                    <div className="text-sm font-medium text-gray-300">
                        Already have an account? <Link to="/login" className="text-primary-800 hover:underline">Log In</Link>
                    </div>
                </form>
                <div>
                    {display}
                </div>
            </div>
            
        </div>
    )
}
// Compare this snippet from RespawnRoom/client/src/components/discoverWrapper.jsx:
