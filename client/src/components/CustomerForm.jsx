import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";

// slide‑in animation reused from your InventoryForm
const slideUpVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

function CustomerForm({ fetchCustomers, editing, setEditing }) {

  const INITIAL_FORM = { name: "", contact: "", email: "", address: "" };
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});


  const emailRegex = /^[\w-.]+@[\w-]+\.[A-Za-z]{2,}$/;
  const phoneRegex = /^\d{7,15}$/; // simple digits 7‑15 chars

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        return value.trim() ? "" : "Name is required";
      case "contact":
        if (!value) return "Contact number is required";
        return phoneRegex.test(value) ? "" : "Invalid phone (7‑15 digits)";
      case "email":
        if (!value) return "Email is required";
        return emailRegex.test(value) ? "" : "Invalid email";
      case "address":
        return value.trim() ? "" : "Address is required";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    Object.entries(form).forEach(([k, v]) => {
      const err = validateField(k, v);
      if (err) nextErrors[k] = err;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };


  useEffect(() => {
    if (editing) {
      setForm({ ...editing });
      setErrors({});
    }
  }, [editing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix highlighted errors first");
      return;
    }
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/api/customers/${editing._id}`, form);
        toast.success("Customer updated successfully!");
        setEditing(null);
      } else {
        await axios.post("http://localhost:5000/api/customers", form);
        toast.success("Customer added successfully!");
      }
      setForm(INITIAL_FORM);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again!");
    }
  };


  const borderClass = (field) => {
    if (errors[field]) return "border-red-500";
    if (form[field] && !errors[field]) return "border-green-500";
    return "border-amber-300";
  };


  const textInput = (name, placeholder, type = "text") => (
    <div>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${borderClass(
          name
        )}`}
      />
      {errors[name] && (
        <p className="text-red-600 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <motion.form
        variants={slideUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        onSubmit={handleSubmit}
        className="space-y-6 p-8 bg-white shadow-lg rounded-xl border border-amber-200 mx-auto max-w-md"
      >
        <h2 className="text-2xl font-bold text-[#7B3F00] text-center lowercase">
          {editing ? "Edit Customer" : "Add New Customer"}
        </h2>

        {textInput("name", "Customer Name")}
        {textInput("contact", "Contact Number")}
        {textInput("email", "Email", "email")}
        {textInput("address", "Address")}

        <button
          type="submit"
          className="w-full bg-[#7B3F00] text-white py-3 rounded-lg hover:bg-[#6A2C00] transition-colors"
        >
          {editing ? "Update Customer" : "Add Customer"}
        </button>
      </motion.form>
    </>
  );
}

export default CustomerForm;
