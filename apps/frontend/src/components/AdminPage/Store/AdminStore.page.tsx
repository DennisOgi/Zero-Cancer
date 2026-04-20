import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { Textarea } from '@/components/shared/ui/textarea'
import {
  useAdminStoreProducts,
  useCreateStoreProduct,
  useUpdateStoreProduct,
} from '@/services/providers/admin.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Edit,
  Package,
  Plus,
  ShoppingCart,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import StoreAnalytics from './StoreAnalytics'
import StoreSearch from './StoreSearch'

// Form schemas
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  stock: z.coerce.number().int().min(0, 'Stock must be a non-negative integer'),
})

export type ProductFormData = z.infer<typeof productSchema>

export function AdminStorePage() {
  // State management
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    product: any
  }>({
    open: false,
    product: null,
  })

  // Build query parameters
  const queryParams = {
    page,
    pageSize: 20,
    ...(search && { search }),
  }

  // Fetch products data
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useAdminStoreProducts(queryParams)

  // Mutations
  const createProductMutation = useCreateStoreProduct()
  const updateProductMutation = useUpdateStoreProduct()

  // Form handling
  const createForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
    },
  })

  const editForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  // Handle create product
  const handleCreateProduct = async (data: ProductFormData) => {
    try {
      await createProductMutation.mutateAsync(data)
      toast.success('Product created successfully')
      setCreateDialog(false)
      createForm.reset()
      refetch()
    } catch (error) {
      toast.error('Failed to create product')
    }
  }

  // Handle update product
  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!editDialog.product) return

    try {
      await updateProductMutation.mutateAsync({
        productId: editDialog.product.id,
        ...data,
      })
      toast.success('Product updated successfully')
      setEditDialog({ open: false, product: null })
      editForm.reset()
      refetch()
    } catch (error) {
      toast.error('Failed to update product')
    }
  }

  // Open edit dialog
  const openEditDialog = (product: any) => {
    setEditDialog({ open: true, product })
    editForm.reset({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return {
        status: 'Out of Stock',
        variant: 'destructive' as const,
        icon: AlertTriangle,
      }
    if (stock <= 10)
      return {
        status: 'Low Stock',
        variant: 'secondary' as const,
        icon: AlertTriangle,
      }
    return { status: 'In Stock', variant: 'default' as const, icon: Package }
  }

  const products = productsData?.data?.products || []
  const totalPages = productsData?.data?.totalPages || 0
  const total = productsData?.data?.total || 0

  // Calculate analytics
  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
  const outOfStockProducts = products.filter((p) => p.stock === 0).length
  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock <= 10,
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Store Management</h1>
          <p className="text-muted-foreground">
            Manage products, inventory, and pricing for the Zero Cancer store
          </p>
        </div>

        <Button
          onClick={() => setCreateDialog(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Analytics Cards */}
      <StoreAnalytics
        totalProducts={totalProducts}
        totalValue={totalValue}
        totalStock={totalStock}
        outOfStockProducts={outOfStockProducts}
        lowStockProducts={lowStockProducts}
      />

      {/* Search and Filters */}
      <StoreSearch
        search={search}
        setSearch={setSearch}
        onClear={() => {
          setSearch('')
          setPage(1)
        }}
      />

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Products ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-4">Failed to load products</p>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
                <Button
                  onClick={() => setCreateDialog(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Add Your First Product
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const stockInfo = getStockStatus(product.stock)
                    const StockIcon = stockInfo.icon
                    const productValue = product.price * product.stock

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {product.name}
                              </span>
                            </div>
                            {product.description && (
                              <p className="text-sm text-muted-foreground">
                                {product.description.length > 50
                                  ? `${product.description.substring(0, 50)}...`
                                  : product.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Boxes className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">{product.stock}</span>
                            <span className="text-muted-foreground text-sm">
                              units
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(productValue)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <StockIcon className="h-4 w-4" />
                            <Badge variant={stockInfo.variant}>
                              {stockInfo.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {format(
                                new Date(product.createdAt),
                                'MMM dd, yyyy',
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(product.createdAt), 'hh:mm a')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product for the Zero Cancer store.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(handleCreateProduct)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="create-name">Product Name *</Label>
              <Input
                id="create-name"
                {...createForm.register('name')}
                placeholder="Enter product name"
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                {...createForm.register('description')}
                placeholder="Enter product description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-price">Price (NGN) *</Label>
                <Input
                  id="create-price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...createForm.register('price')}
                  placeholder="0.00"
                />
                {createForm.formState.errors.price && (
                  <p className="text-sm text-destructive mt-1">
                    {createForm.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="create-stock">Stock Quantity *</Label>
                <Input
                  id="create-stock"
                  type="number"
                  min="0"
                  {...createForm.register('stock')}
                  placeholder="0"
                />
                {createForm.formState.errors.stock && (
                  <p className="text-sm text-destructive mt-1">
                    {createForm.formState.errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProductMutation.isPending}>
                {createProductMutation.isPending
                  ? 'Creating...'
                  : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, product: null })}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details and inventory.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(handleUpdateProduct)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                {...editForm.register('name')}
                placeholder="Enter product name"
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...editForm.register('description')}
                placeholder="Enter product description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price (NGN) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...editForm.register('price')}
                  placeholder="0.00"
                />
                {editForm.formState.errors.price && (
                  <p className="text-sm text-destructive mt-1">
                    {editForm.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-stock">Stock Quantity *</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min="0"
                  {...editForm.register('stock')}
                  placeholder="0"
                />
                {editForm.formState.errors.stock && (
                  <p className="text-sm text-destructive mt-1">
                    {editForm.formState.errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialog({ open: false, product: null })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending
                  ? 'Updating...'
                  : 'Update Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
