import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { loginUser } from "../redux/thunk/auth-thunk";
import { useDispatch, useSelector } from "react-redux";
import { authUserSelector } from "../redux/slice/user-slice.ts";
import type { AppDispatch } from "../redux/type";
import type { LoginFormData } from "../types";

const Login = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const user = useSelector(authUserSelector);
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = user.loading === "pending";

  console.log(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Add your login logic here
    console.log("Login:", formData);
    // fetch('http://cloud.ninesense.lk:3001/api/Authentication/login', {
    //     method: 'POST',
    //     body: JSON.stringify({email: formData.email, password: formData.password}),
    //     headers: {'Content-Type': 'application/json'},
    // }).then(res => res.json()).then(data => console.log(data)).catch(err => console.log(err));
    dispatch(loginUser({ email: formData.email, password: formData.password }));
  };

  if (user.loading == "succeeded") return <Navigate to="/" />;

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative flex flex-col items-center">
            {/* Spinner */}
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            {/* Loading Text */}
            <p className="mt-4 text-white text-lg font-semibold animate-pulse">
              Logging in...
            </p>
          </div>
        </div>
      )}

      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.15),_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(255,255,255,0.1),_transparent_50%)]"></div>
      </div>

      {/* Floating Shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>

      <div className="relative max-w-md w-full z-10">
        {/* Glassmorphism Card */}
        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>

          {/* Content */}
          <div className="relative">
            {/* Logo */}
            <div className="text-center mb-8">
              <img
                src="/assets/images/NS_logo Dark.svg"
                alt="NS HIMS"
                className="h-12 mx-auto mb-4"
              />
              <h2 className="text-3xl font-bold text-gray-900">
                Hello! Welcome
              </h2>
              <p className="mt-2 text-sm text-gray-600">Sign in to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="sr-only">
                  Username
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Username"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Keep me signed in
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="#"
                    className="font-medium text-primary hover:text-primary-dark"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full btn-enhanced primary text-lg py-3 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "SIGNING IN..." : "SIGN IN"}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:text-primary-dark"
                  >
                    Create
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
