import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import  Auth  from '../utils/auth';
import { login } from '../Api/auth';

export default function Login() {
  const [loginData, setLoginData] = useState({
    userName: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('User logged in', loginData);
    try {
      const data = await login(loginData);
      Auth.login(data.token);
    } catch (err) {
      console.error('Failed to login', err);
    }
  };

  const [loginCheck, setLoginCheck] = useState(false);

  const checkLogin = () => {
    if (Auth.loggedIn()) {
      setLoginCheck(true);
    }
  };

  useEffect(() => {
    checkLogin();
  }, [loginCheck]);

  return (
    <div className="flex flex-col items-center justify-center mt-35">
        <div className="w-full max-w-sm p-4 border border-surface-600 rounded-lg shadow-sm sm:p-6 md:p-8 bg-tonal-900">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <h5 className="text-xl font-medium text-light">RespawnRoom // Login</h5>
                <div>
                    <label htmlFor="userName" className="block mb-2 text-sm font-medium text-light">Username</label>
                    <input 
                    type="text" 
                    name="userName" 
                    onChange={handleChange}
                    value={loginData.userName} 
                    placeholder="Enter Your Username"
                    className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5" 
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-light">Password</label>
                    <input 
                    type="password" 
                    name="password" 
                    onChange={handleChange}
                    value={loginData.password} 
                    placeholder="Enter Your Password" 
                    className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5"
                    />
                </div>
                <button type="submit" className="w-full text-white focus:ring-4 bg-primary-600 hover:bg-primary-700 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center focus:ring-primary-900">Login to your account</button>
                <div className="text-sm font-medium text-gray-300">
                    Not registered? <Link to="/register" className="text-primary-800 hover:underline">Create account</Link>
                </div>
            </form>
        </div>  
    </div>
  );
}