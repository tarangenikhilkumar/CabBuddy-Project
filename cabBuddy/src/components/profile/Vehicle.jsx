import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Car, Bike, Users, Hash, Info } from "lucide-react";
import {
  addVehicle,
  getDriverVehicles,
  updateVehicle,
  deleteVehicle,
} from "../../api/VehicleApi";

/**
 * Vehicle Component
 * Manages the registration, listing, updating, and deletion of driver vehicles.
 * Ensuring data persistence through JWT-based fetching on component mount.
 */
export default function Vehicle() {
  // Array to store the list of vehicles fetched from the database
  const [vehicles, setVehicles] = useState([]);
  
  // State for the controlled form inputs
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    model: "",
    type: "",
    capacity: "",
  });
  
  // Tracks the ID of the vehicle currently being edited (null when in 'Add' mode)
  const [editingId, setEditingId] = useState(null);
  
  // Loading state to provide visual feedback during API calls
  const [loading, setLoading] = useState(false);

  /* ----------------------------------
      LOGIC FIX (ONLY THIS PART CHANGED)
      ✅ token based loadin
  ---------------------------------- */
  /**
   * Effect Hook: Runs once on mount.
   * Checks for a valid JWT token to trigger the initial data fetch.
   * This is critical for keeping the right-side data visible after a page refresh.
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadVehicles();
    }
  }, []);

  /**
   * Fetches the driver's specific vehicles from the backend.
   * Uses the stored token to authenticate the request.
   */
  const loadVehicles = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      const response = await getDriverVehicles(token);
      // Synchronize local state with the backend response
      setVehicles(response.data || []);
    } catch (error) {
      console.error("Failed to load vehicles", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles real-time updates to form state as the user types.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ----------------------------------
      POST / PUT (UNCHANGED)
  ---------------------------------- */
  /**
   * Submits the form data to either create a new vehicle or update an existing one.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      const vehicleData = {
        vehicleNumber: formData.vehicleNumber,
        model: formData.model,
        type: formData.type,
        capacity: parseInt(formData.capacity),
      };

      // Branch logic based on whether we are editing an existing record or creating a new one
      if (editingId) {
        await updateVehicle(editingId, vehicleData, token);
      } else {
        await addVehicle(vehicleData, token);
      }

      // Reset form and UI state after successful submission
      setFormData({
        vehicleNumber: "",
        model: "",
        type: "",
        capacity: "",
      });
      setEditingId(null);

      // Re-fetch data from the backend to ensure the right-side list is current
      loadVehicles(); 

      alert("Vehicle saved successfully!");
    } catch (error) {
      console.error("Vehicle save failed", error.response?.data || error.message);
      alert(
        `Failed to save vehicle: ${
          error.response?.status === 403
            ? "Access Denied (Check Token)"
            : "Error"
        }`
      );
    }
  };

  /**
   * Populates the form with existing vehicle data to enter Edit mode.
   */
  const handleEdit = (vehicle) => {
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      model: vehicle.model,
      type: vehicle.type,
      capacity: vehicle.capacity,
    });
    setEditingId(vehicle.id);
  };

  /**
   * Removes a vehicle record from the backend and updates the UI.
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;

    const token = localStorage.getItem("token");

    try {
      await deleteVehicle(id, token);
      // Optimistically update the UI by filtering out the deleted item
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete vehicle");
    }
  };

  /* ----------------------------------
      UI 
  ---------------------------------- */
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Vehicle Management
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Register and manage your fleet for active duty.
            </p>
          </div>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl shadow-lg shadow-blue-200 flex items-center gap-2 w-fit">
            <Car size={20} />
            <span className="font-bold">{vehicles.length} Vehicles</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-4">
            <Card className="p-6 sticky top-8 border-none shadow-2xl shadow-slate-200/60 bg-white rounded-3xl">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                {editingId ? (
                  <Pencil size={18} className="text-orange-500" />
                ) : (
                  <Plus size={18} className="text-blue-500" />
                )}
                {editingId ? "Edit Vehicle" : "Add New Vehicle"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Vehicle Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      placeholder="e.g. MH12AB1234"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Model Name
                  </label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g. Toyota Camry"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Type
                  </label>
                  <div className="flex gap-3">
                    {["CAR", "BIKE"].map((type) => (
                      <label
                        key={type}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          formData.type === type
                            ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm"
                            : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          checked={formData.type === type}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        {type === "CAR" ? <Car size={18} /> : <Bike size={18} />}
                        <span className="font-semibold text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Seat Capacity
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      min="1"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <Button
                  className={`w-full py-6 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 ${
                    editingId
                      ? "bg-orange-500 hover:bg-orange-600 shadow-orange-100"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                  }`}
                >
                  {editingId ? "Update Details" : "Register Vehicle"}
                </Button>

                {editingId && (
                  <Button
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-slate-600"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        vehicleNumber: "",
                        model: "",
                        type: "",
                        capacity: "",
                      });
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </form>
            </Card>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Loading Skeleton/Spinner View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4 text-slate-400">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium animate-pulse">Syncing with garage...</p>
              </div>
            ) : vehicles.length === 0 ? (
              /* Empty State View */
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="text-slate-300" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-700">No vehicles found</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">
                  Your fleet is currently empty. Use the form to add your first vehicle.
                </p>
              </div>
            ) : (
              /* Vehicle List View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    className="p-5 border-none shadow-md hover:shadow-xl transition-all group bg-white rounded-3xl relative overflow-hidden"
                  >
                    {/* Background Decorative Icon */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      {vehicle.type === "CAR" ? <Car size={80} /> : <Bike size={80} />}
                    </div>

                    <div className="flex flex-col h-full justify-between gap-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                            {vehicle.type}
                          </span>
                          <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                            {vehicle.vehicleNumber}
                          </h4>
                          <p className="text-slate-500 font-medium">{vehicle.model}</p>
                        </div>
                        <div className="bg-slate-50 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-slate-100">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-600">
                            {vehicle.capacity}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-50">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold transition-colors"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <Pencil size={14} className="mr-2" /> Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold transition-colors"
                          onClick={() => handleDelete(vehicle.id)}
                        >
                          <Trash2 size={14} className="mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}