import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from "flowbite-react";
import { useNavigate } from 'react-router-dom';
import type { loginUserResponse } from '../apis/DataResponse/responses';
import { login } from '../apis/Controller/apisController';

// type LoginProps = {
//     onConnect: () => void;
// };

const Login: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({
        email: '',
        password: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { connect, setCurrentUser, loadUser } = useChat();
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [darkMode, setDarkMode] = useState(false);
    const [redMode, setRedMode] = useState(false);

    const validateForm = () => {
        const newErrors = {
            email: formData.email.trim() ?
                (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? '' : 'Invalid email format')
                : 'Email is required',
            password: formData.password.length >= 6 ? '' : 'Password must be at least 6 characters'
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setMousePosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const getGradientColors = () => {
        if (darkMode && redMode) return ['#450a0a', '#7f1d1d', '#991b1b'];
        if (darkMode) return ['#0f172a', '#1e293b', '#334155'];
        if (redMode) return ['#fee2e2', '#fecaca', '#fca5a5'];
        return ['#3b82f6', '#8b5cf6', '#ec4899'];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            const userLoggedIn = await login(formData);

            console.log("User logged in:", userLoggedIn);

            setCurrentUser(userLoggedIn);
            connect({
                id: userLoggedIn.id || '',
                email: formData.email,
                token: userLoggedIn.token,
                refreshToken: userLoggedIn.refreshToken,
                firstName: userLoggedIn.firstName,
                lastName: userLoggedIn.lastName,
                cin: userLoggedIn.cin,
                role: userLoggedIn.role,
                tel: userLoggedIn.tel
            });



            await loadUser();



            navigate('/chatAsistant');

        } catch (error: any) {
            console.error("Error during login:", error);
            setErrors({
                email: 'Invalid credentials',
                password: 'Invalid credentials'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));

        // Clear error when user types
        if (errors[id as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const gradientStyle = {
        background: `radial-gradient(at ${mousePosition.x}% ${mousePosition.y}%, ${getGradientColors().join(', ')})`,
        transition: 'background 0.3s ease-out',
        minHeight: '100vh'
    };

    const formContainerStyle = {
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        color: darkMode ? 'white' : 'inherit'
    };

    return (
        <div className="flex items-center justify-center p-4 flex-col" style={gradientStyle}>
            {/* Theme toggle buttons */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                        }`}
                >
                    {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <button
                    onClick={() => setRedMode(!redMode)}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${redMode ? 'bg-red-600 text-white' : 'bg-white text-red-600'
                        }`}
                >
                    {redMode ? '🌈 Normal Colors' : '🔥 Red Theme'}
                </button>
            </div>

            <div className="rounded-lg shadow-xl p-8 w-full max-w-md" style={formContainerStyle}>
                <h2 className="text-2xl font-bold mb-6">
                    {redMode ? '🔥 ' : ''}
                    Login to Chat
                    {darkMode ? ' 🌙' : ''}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                            style={{
                                borderColor: errors.email ? '#ef4444' : darkMode ? '#334155' : '#d1d5db',
                                backgroundColor: darkMode ? '#1e293b' : 'white',
                                color: darkMode ? 'white' : 'inherit'
                            }}
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                            style={{
                                borderColor: errors.password ? '#ef4444' : darkMode ? '#334155' : '#d1d5db',
                                backgroundColor: darkMode ? '#1e293b' : 'white',
                                color: darkMode ? 'white' : 'inherit'
                            }}
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-2 px-4 rounded-md font-medium transition-all ${isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : redMode
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : darkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {isSubmitting ? 'Logging in...' : 'Connect'}
                    </button>
                </form>
            </div>
            <div className="mt-6 flex flex-row items-center justify-center bg-gradient-to-r from-gray-800 to-gray-900 bg-opacity-90 rounded-lg shadow-md p-4 w-full max-w-md transition-all duration-300 hover:shadow-lg">
                <p className="text-white text-lg font-medium mr-4">
                    Don't have an account?
                </p>
                <Button
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:bg-gradient-to-bl focus:ring-4 focus:ring-cyan-300 dark:focus:ring-blue-800 h-10 px-6 py-2 rounded-lg transition duration-300"
                // onClick={() => navigate('/signup')}
                >
                    Sign Up
                </Button>
            </div>
        </div>
    );
};

export default Login;