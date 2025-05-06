import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { ADD_USER } from "../utils/mutations";
import Auth from "../utils/auth";

export default function Register() {
  const [registerForm, setRegisterForm] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // Use Apollo's useMutation hook for the ADD_USER mutation
  const [addUser, { loading }] = useMutation(ADD_USER);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !registerForm.userName ||
      !registerForm.email ||
      !registerForm.password ||
      !registerForm.confirmPassword
    ) {
      setError("Please fill out all fields");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Use the ADD_USER mutation
      const { data } = await addUser({
        variables: {
          userName: registerForm.userName,
          email: registerForm.email,
          password: registerForm.password,
        },
      });
      Auth.login(data.addUser.token);
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Failed to register. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center md:mt-35 m-25">
      <div className="w-full max-w-sm p-4 border border-surface-600 rounded-lg shadow-sm sm:p-6 md:p-8 bg-tonal-900">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <h5 className="text-xl font-medium text-light">
            RespawnRoom // Register
          </h5>

          {/* Error Display */}
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          {/* Google Login Button */}
          <div className="text-center">
            <a
              href="http://localhost:3001/auth/google"
              className="w-full text-center mb-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 19"
              >
                <path
                  fillRule="evenodd"
                  d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z"
                  clipRule="evenodd"
                />
              </svg>
              Continue with Google
            </a>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-light">
              Username
            </label>
            <input
              type="text"
              name="userName"
              value={registerForm.userName}
              onChange={handleChange}
              placeholder="Username"
              className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-light">
              Email
            </label>
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
            <label className="block mb-2 text-sm font-medium text-light">
              Password
            </label>
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
            <label className="block mb-2 text-sm font-medium text-light">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={registerForm.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5"
            />
          </div>

          <button
            type="submit"
            className="w-full text-white focus:ring-4 bg-primary-600 hover:bg-primary-700 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center focus:ring-primary-900"
          >
            {loading ? "Registering..." : "Register"}
          </button>
          <div className="text-sm font-medium text-gray-300">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-800 hover:underline">
              Log In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}