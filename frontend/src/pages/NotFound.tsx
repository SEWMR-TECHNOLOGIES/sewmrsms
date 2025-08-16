import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center animate-fadeIn">
        <h1 className="text-6xl font-extrabold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <p className="text-gray-500 mb-6">The URL <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code> does not exist.</p>
        <Link
          to="/"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium shadow hover:bg-primary/90 transition"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
