import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function Signup() {
  const navigate = useNavigate();

  // FORM STATE
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();

    let err = {};

    if (!fullname.trim()) err.fullname = "Name required";
    if (!email.trim()) err.email = "Email required";
    if (!role) err.role = "Role required";

    if (email && !email.includes("@")) {
      err.email = "Enter valid email";
    }

    if (!phone) {
      err.phone = "Phone required";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      err.phone = "Enter valid Indian phone number";
    }

    if (!password || password.length < 8) {
      err.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      err.passwordMatch = "Passwords do not match";
    }

    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    const signupData = {
      name: fullname.trim(),
      email: email.trim(),
      password,
      phone,
      role
    };

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signupData)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Signup failed");
      }

      alert("Signup successful 🎉");
      navigate("/login");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-md rounded-2xl border shadow-sm">
        <CardContent className="p-8 space-y-6">

          <div className="text-center">
            <h1 className="text-2xl font-bold">Create an account</h1>
            <p className="text-gray-500">Sign up to continue with CabBuddy</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>

            <div>
              <Label>Full Name</Label>
              <Input
                value={fullname}
                onChange={(e) => {
                  setFullname(e.target.value);
                  setErrors({ ...errors, fullname: "" });
                }}
              />
              {errors.fullname && <p className="text-red-500 text-xs">{errors.fullname}</p>}
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: "" });
                }}
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors({ ...errors, phone: "" });
                }}
              />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
            </div>

            <div>
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setErrors({ ...errors, role: "" });
                }}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select role</option>
                <option value="USER">User</option>
                <option value="DRIVER">Driver</option>
              </select>
              {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>

            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.passwordMatch && (
                <p className="text-red-500 text-xs">{errors.passwordMatch}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-medium">
                Login
              </Link>
            </p>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
