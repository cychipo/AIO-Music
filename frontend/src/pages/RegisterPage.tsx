import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Music } from "lucide-react";

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const onFinish = async (values: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    setError("");
    try {
      await register(values.email, values.password, values.displayName);
      navigate("/");
    } catch (e: any) {
      setError(e.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#faf2e8" }}
    >
      <div className="card-pastel p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Music className="text-white" size={22} />
          </div>
          <span className="font-bold text-2xl text-text-primary">VibeX</span>
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">
          Create an account
        </h2>

        {error && <Alert message={error} type="error" className="mb-4" />}

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="displayName"
            label="Display Name"
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="Your name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input size="large" placeholder="you@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password size="large" placeholder="Min. 6 characters" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isLoading}
            block
            className="mt-2"
          >
            Create Account
          </Button>
        </Form>

        <p className="text-center text-sm text-text-muted mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
