import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaBox,
  FaTimes,
  FaSync,
} from "react-icons/fa";
import { IoMdClose, IoMdCloudUpload } from "react-icons/io";
import { Link } from "react-router-dom";
import Container from "@/components/layouts/Container";
import PriceFormat from "@/components/layouts/PriceFormat";
import productService from "@/services/productService";
import categoryService from "@/services/categoryService";
import brandService from "@/services/brandService";
import Product, { CreateOrUpdateProduct } from "@/types/Product";
import Category from "@/types/Category";
import Brand from "@/types/Brand";
import Input, { Label } from "@/components/partials/Input";
import SmallLoader from "@/components/layouts/SmallLoader";

interface formData {
  type: string,
  name: string,
  description: string,
  brand: string,
  price: string,
  discountedPercentage: number,
  stock: string,
  category: string,
  offer: boolean,
  isAvailable: boolean,
  badge: boolean,
  tags: string[],
}

const Products = () => {
  const [list, setList] = useState<Product[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Categories and brands for edit modal
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Edit form data
  const [formData, setFormData] = useState<formData>({
    type: "",
    name: "",
    description: "",
    brand: "",
    price: "",
    discountedPercentage: 10,
    stock: "",
    category: "",
    offer: false,
    isAvailable: true,
    badge: false,
    tags: [],
  });

  const [imageFiles, setImageFiles] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });
  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      const data = response?.data;

      if (data?.success) {
        setList(data?.products);
      } else {
        toast.error(data?.message);
      }
    } catch (error: Error | any) {
      console.log("Product List fetching error", error?.message);
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and brands for edit modal
  const fetchCategoriesAndBrands = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        await categoryService.getCategories(),
        await brandService.getBrands(),
      ]);

      const categoriesData = await categoriesRes.json();
      const brandsData = await brandsRes.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }
      if (brandsData.success) {
        setBrands(brandsData.brands);
      }
    } catch (error) {
      console.error("Error fetching categories and brands:", error);
      toast.error("Failed to load categories and brands");
    }
  };

  useEffect(() => {
    fetchList();
    fetchCategoriesAndBrands();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (
      type === "select-one" &&
      (name === "offer" || name === "isAvailable" || name === "badge")
    ) {
      setFormData({
        ...formData,
        [name]: value === "true",
      });
    } else if (
      name === "price" ||
      name === "discountedPercentage" ||
      name === "stock"
    ) {
      setFormData({
        ...formData,
        [name]: value === "" ? "" : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle individual image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageKey: string) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImageFiles((prev) => ({
        ...prev,
        [imageKey]: file,
      }));
    }
  };

  // Remove an image
  const removeImage = (imageKey: string) => {
    setImageFiles((prev) => ({
      ...prev,
      [imageKey]: null,
    }));
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      type: product.type || "",
      name: product.name || "",
      description: product.description || "",
      brand: product.brand || "",
      price: product.price?.toString() || "",
      discountedPercentage: product.discountedPercentage || 10,
      stock: product.stock?.toString() || "",
      category: product.category || "",
      offer: product.offer || false,
      isAvailable: product.isAvailable !== false,
      badge: product.badge || false,
      tags: product.tags || [],
    });
    setImageFiles({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setFormData({
      type: "",
      name: "",
      description: "",
      brand: "",
      price: "",
      discountedPercentage: 10,
      stock: "",
      category: "",
      offer: false,
      isAvailable: true,
      badge: false,
      tags: [],
    });
    setImageFiles({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
  };

  // Open delete modal
  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingProduct(null);
  };

  // Handle product update
  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingProduct) return;

    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.category
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare data
      const data: CreateOrUpdateProduct = { ...formData, 
        tags: JSON.stringify(formData.tags),
        images: Object.values(imageFiles).filter((file) => file !== null) as string[],
      };

      const response = await productService.updateProduct(editingProduct._id, data);

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success("Product updated successfully");
        await fetchList();
        closeEditModal();
      } else {
        toast.error(responseData?.message || "Failed to update product");
      }
    } catch (error: Error | any) {
      console.log("Product update error", error);
      toast.error(error?.response?.data?.message || "Error updating product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveProduct = async () => {
    if (!deletingProduct) return;

    try {
      setSubmitting(true);
      const response = await productService.deleteProduct(deletingProduct._id);
      const data = response?.data;
      if (data?.success) {
        toast.success(data?.message);
        await fetchList();
        closeDeleteModal();
      } else {
        toast.error(data?.message);
      }
    } catch (error: Error | any) {
      console.log("Product remove error", error);
      toast.error(error?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products based on search
  const filteredList = list.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand &&
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Products
            </h1>
            <p className="text-gray-600 mt-1">Manage your product inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchList}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              title="Refresh Products"
            >
              <FaSync className="w-4 h-4" />
              Refresh
            </button>
            <Link
              to="/add"
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FaPlus />
              Add Product
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Products List */}
        {isLoading ? (
          <>
            {/* Desktop Table Skeleton */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards Skeleton */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="flex gap-2 mt-3">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12">
            <FaBox className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? "No products found" : "No products yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start by adding your first product"}
            </p>
            {!searchTerm && (
              <Link
                to="/add"
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add Product
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredList.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <img
                            src={product.images?.[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {product.name}
                          </div>
                          {product.brand && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.brand}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            <PriceFormat amount={product.price} />
                          </div>
                          {product.discountedPercentage > 0 && (
                            <div className="text-xs text-green-600">
                              {product.discountedPercentage}% off
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {product.stock || 0}
                          </div>
                          <div
                            className={`text-xs ${
                              product.stock > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            >
                              <FaEdit />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(product)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            >
                              <FaTrash />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredList.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                        {product.brand && (
                          <span className="text-xs text-gray-500">
                            {product.brand}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            <PriceFormat amount={product.price} />
                          </div>
                          {product.discountedPercentage > 0 && (
                            <div className="text-xs text-green-600">
                              {product.discountedPercentage}% off
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">
                            Stock: {product.stock || 0}
                          </div>
                          <div
                            className={`text-xs ${
                              product.stock > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          <FaEdit />
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeEditModal();
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Edit Product</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IoMdClose size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="p-6 space-y-6">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Product Images
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(imageFiles).map(
                      ([imageKey, imageFile], index) => (
                        <div key={imageKey} className="relative">
                          <label htmlFor={`edit-${imageKey}`} className="block">
                            <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors duration-200 min-h-[120px] flex flex-col items-center justify-center bg-white">
                              {imageFile ? (
                                <>
                                  <img
                                    src={URL.createObjectURL(
                                      imageFile
                                    )}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-md mb-2"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      removeImage(imageKey);
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  >
                                    <FaTimes className="text-xs" />
                                  </button>
                                  <span className="text-xs text-gray-600">
                                    Change
                                  </span>
                                </>
                              ) : editingProduct?.images?.[index] ? (
                                <>
                                  <img
                                    src={editingProduct.images[index]}
                                    alt={`Current ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-md mb-2"
                                  />
                                  <span className="text-xs text-gray-600">
                                    Replace
                                  </span>
                                </>
                              ) : (
                                <>
                                  <IoMdCloudUpload className="text-3xl text-gray-400 mb-2" />
                                  <span className="text-xs text-gray-600">
                                    Upload Image {index + 1}
                                  </span>
                                </>
                              )}
                              <input
                                type="file"
                                id={`edit-${imageKey}`}
                                hidden
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, imageKey)}
                              />
                            </div>
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select brand</option>
                      {brands.map((brand) => (
                        <option key={brand._id} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <Label htmlFor="discountedPercentage">Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="discountedPercentage"
                      value={formData.discountedPercentage}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex flex-col">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      type="number"
                      min="0"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="_type">Product Type</Label>
                    <select
                      name="_type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="new_arrivals">New Arrivals</option>
                      <option value="best_sellers">Best Sellers</option>
                      <option value="special_offers">Special Offers</option>
                      <option value="promotions">Promotions</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="isAvailable">Availability</Label>
                    <select
                      name="isAvailable"
                      value={formData.isAvailable.toString()}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Available</option>
                      <option value="false">Out of Stock</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="offer">Special Offer</Label>
                    <select
                      name="offer"
                      value={formData.offer.toString()}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="badge">Show Badge</Label>
                    <select
                      name="badge"
                      value={formData.badge.toString()}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                    {[
                      "Fashion",
                      "Electronics",
                      "Sports",
                      "Accessories",
                      "Others",
                    ].map((tag) => (
                      <div className="flex items-center space-x-2" key={tag}>
                        <input
                          id={`edit-${tag.toLowerCase()}`}
                          type="checkbox"
                          value={tag}
                          checked={formData.tags.includes(tag)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prevData) => ({
                                ...prevData,
                                tags: [...prevData.tags, tag],
                              }));
                            } else {
                              setFormData((prevData) => ({
                                ...prevData,
                                tags: prevData.tags.filter((t) => t !== tag),
                              }));
                            }
                          }}
                        />
                        <label
                          htmlFor={`edit-${tag.toLowerCase()}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <SmallLoader />
                        Updating...
                      </>
                    ) : (
                      "Update Product"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeDeleteModal();
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaTrash className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Delete Product
                    </h3>
                    <p className="text-gray-600">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                {deletingProduct && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={deletingProduct.images?.[0]}
                        alt={deletingProduct.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {deletingProduct.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {deletingProduct.category}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this product? This will
                  permanently remove it from your inventory.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemoveProduct}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <SmallLoader />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FaTrash />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Products;
