import { useState, useEffect, useRef } from 'react';
import { useAppContext, OrderStatus } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, ChevronLeft, ChevronRight, Search, Filter, Bell, X, Plus, Edit, Trash2, Package } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function BackOffice() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token === 'admin-token-xyz') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('https://apisam.mgd-crm.com/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Mot de passe incorrect');
      }
    } catch (error) {
      setLoginError('Erreur de connexion au serveur');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Accès Restreint</CardTitle>
            <CardDescription>
              Veuillez vous connecter pour accéder au tableau de bord d'administration.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="•••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && (
                <div className="text-sm text-red-500 font-medium">{loginError}</div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoggingIn}>
                {isLoggingIn ? 'Connexion...' : 'Se connecter'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <BackOfficeAuthenticated onLogout={handleLogout} />
  );
}

function BackOfficeAuthenticated({ onLogout }: { onLogout: () => void }) {
  const { orders } = useAppContext();
  const [showNotification, setShowNotification] = useState(false);
  const previousOrdersCountRef = useRef(0);

  // Monitor for new orders and show notification
  useEffect(() => {
    if (orders.length > previousOrdersCountRef.current && previousOrdersCountRef.current > 0) {
      setShowNotification(true);

      // Play notification sound
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(e => console.log('Audio play failed:', e));

      // Auto-hide notification after 5 seconds
      setTimeout(() => setShowNotification(false), 5000);
    }
    previousOrdersCountRef.current = orders.length;
  }, [orders.length]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* New Order Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce">
          <Bell className="w-5 h-5" />
          <span className="font-medium">Nouvelle commande reçue !</span>
          <button
            onClick={() => setShowNotification(false)}
            className="ml-2 bg-green-700 hover:bg-green-800 rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-gray-500 mt-1">Gérez vos commandes, votre menu et consultez vos statistiques.</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="text-gray-600">
            Déconnexion
          </Button>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="orders" className="data-[state=active]:bg-red-50 data-[state=active]:text-[#cc0000]">Commandes</TabsTrigger>
            <TabsTrigger value="menu" className="data-[state=active]:bg-red-50 data-[state=active]:text-[#cc0000]">Menu & Stock</TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-red-50 data-[state=active]:text-[#cc0000]">Statistiques</TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-red-50 data-[state=active]:text-[#cc0000]">Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <OrdersManager />
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <MenuManager />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
                <CardDescription>Consultez vos statistiques de vente.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Fonctionnalité en cours de développement...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <ClientsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OrdersManager() {
  const { orders, updateOrderStatus } = useAppContext();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'attente_paiement': return 'bg-red-100 text-red-800 border-red-200';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_preparation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pret': return 'bg-green-100 text-green-800 border-green-200';
      case 'livre': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: OrderStatus) => {
    switch (status) {
      case 'attente_paiement': return 'Attente Paiement';
      case 'en_attente': return 'En attente';
      case 'en_preparation': return 'En préparation';
      case 'pret': return 'Prêt';
      case 'livre': return 'Livré';
      default: return status;
    }
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Commandes</CardTitle>
            <CardDescription>Consultez et mettez à jour le statut des commandes clients.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
              {statusFilter !== 'all' && ` • filtré sur: ${formatStatus(statusFilter as OrderStatus)}`}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Status Filter */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Label htmlFor="status-filter" className="text-sm font-medium">Filtrer par statut:</Label>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="attente_paiement">Attente Paiement</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="en_preparation">En préparation</SelectItem>
              <SelectItem value="pret">Prêt</SelectItem>
              <SelectItem value="livre">Livré</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Heure</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Aucune commande{statusFilter !== 'all' ? ' avec ce statut' : ''} pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      order.deliveryMethod === 'livraison'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }>
                      {order.deliveryMethod === 'livraison' ? 'Livraison' : 'Sur place'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-gray-500">
                      {order.items?.map((item: any) => `${item.quantity}x ${item.menuItem.name}`).join(', ') || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{order.total.toFixed(2)}€</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                      className="w-[140px]"
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <Badge variant="outline" className={`capitalize ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attente_paiement">Attente Paiement</SelectItem>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="en_preparation">En préparation</SelectItem>
                        <SelectItem value="pret">Prêt</SelectItem>
                        <SelectItem value="livre">Livré</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/suivi?orderId=${order.id}`, '_blank')}
                        className="text-xs"
                      >
                        Voir détails
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Affichage {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} sur {filteredOrders.length} commandes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 font-medium px-3">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClientsManager() {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('https://apisam.mgd-crm.com/api/customers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        setClients(data.sort((a: any, b: any) => b.totalSpent - a.totalSpent));
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Filter clients by name
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">Chargement des clients...</div>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle>Clients</CardTitle>
        <CardDescription>Gérez et consultez les informations clients.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom de client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead className="text-right">Commandes</TableHead>
              <TableHead className="text-right">Total dépensé</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-gray-600">{client.email || '-'}</TableCell>
                  <TableCell className="text-gray-600">{client.phone || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{client.totalOrders}</TableCell>
                  <TableCell className="text-right font-semibold">{client.totalSpent.toFixed(2)}€</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MenuManager() {
  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle>Menu & Stock</CardTitle>
        <CardDescription>Gérez vos catégories, produits et options de configuration.</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="categories" className="data-[state=active]:bg-red-50 data-[state=active]:text-[#cc0000]">
              Catégories
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-red-50 data-[state=active]:text-[#cc0000]">
              Produits
            </TabsTrigger>
            <TabsTrigger value="options" className="data-[state=active]:bg-red-50 data-[state=active]:text-[#cc0000]">
              Options
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <CategoriesManager />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductsManager />
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <OptionsManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Category type definition
interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://apisam.mgd-crm.com/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setCategories(data.sort((a: Category, b: Category) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCategory = async (category: Partial<Category>) => {
    try {
      const token = localStorage.getItem('adminToken');
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory
        ? `https://apisam.mgd-crm.com/api/categories/${editingCategory.id}`
        : 'https://apisam.mgd-crm.com/api/categories';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
      });

      if (response.ok) {
        setEditingCategory(null);
        setIsAdding(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`https://apisam.mgd-crm.com/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Catégories ({categories.length})</h3>
        <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{category.name}</h4>
                  <div className="text-sm text-gray-600">
                    <div>Ordre: {category.sortOrder}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(isAdding || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSave={handleSaveCategory}
          onCancel={() => {
            setEditingCategory(null);
            setIsAdding(false);
          }}
        />
      )}
    </>
  );
}

function CategoryForm({ category, onSave, onCancel }: {
  category: Category | null;
  onSave: (category: Partial<Category>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    sortOrder: category?.sortOrder || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{category ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Ordre d'affichage</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
              {category ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function ProductsManager() {
  const { menuItems, configOptions, updateMenuItemAvailability } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://apisam.mgd-crm.com/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const allCategories = ['all', ...categories.map(c => c.name)].sort();

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    await updateMenuItemAvailability(itemId, !currentStatus);
  };

  const handleSaveItem = async (item: any) => {
    try {
      const token = localStorage.getItem('adminToken');
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? `https://apisam.mgd-crm.com/api/menu/${editingItem.id}`
        : 'https://apisam.mgd-crm.com/api/menu';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        setEditingItem(null);
        setIsAdding(false);
        // Reload menu
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`https://apisam.mgd-crm.com/api/menu/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Reload menu
        window.location.reload();
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Produits ({filteredItems.length})</h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'Toutes les catégories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className={`relative ${!item.available ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Prix HT:</span>
                      <span className="font-medium">{((item.basePriceHT || item.basePrice / 1.1)).toFixed(2)}€</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">TVA:</span>
                      <span className="font-medium">{(item.vatRate || 10)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Prix TTC:</span>
                      <span className="font-bold text-primary">{item.basePrice.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.available}
                    onCheckedChange={() => handleToggleAvailability(item.id, item.available)}
                  />
                  <Label className="text-sm">
                    {item.available ? 'En stock' : 'Rupture'}
                  </Label>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(isAdding || editingItem) && (
        <ProductForm
          item={editingItem}
          categories={categories}
          configOptions={configOptions}
          onSave={handleSaveItem}
          onCancel={() => {
            setEditingItem(null);
            setIsAdding(false);
          }}
        />
      )}
    </>
  );
}

function ProductForm({ item, categories, configOptions, onSave, onCancel }: {
  item: any;
  categories: Category[];
  configOptions: any[];
  onSave: (item: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    basePriceHT: item?.basePriceHT || (item?.basePrice ? item.basePrice / 1.1 : ''),
    vatRate: item?.vatRate || 10,
    image: item?.image || '',
    category: item?.category || (categories[0]?.name || 'pizza'),
    allowedConfigCategories: item?.allowedConfigCategories || [],
    available: item?.available !== undefined ? item.available : true,
  });

  const vatRates = [
    { value: 5.5, label: '5.5% - Aliments de base' },
    { value: 10, label: '10% - Repas standard' },
    { value: 20, label: '20% - Boissons, desserts' },
  ];

  const configCategories = [
    { value: 'taille', label: 'Taille' },
    { value: 'sauce', label: 'Sauce' },
    { value: 'supplement', label: 'Suppléments' },
    { value: 'cuisson', label: 'Cuisson' },
    { value: 'fromage', label: 'Fromage' },
    { value: 'viande', label: 'Viande' },
    { value: 'legumes', label: 'Légumes' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const basePriceHT = parseFloat(formData.basePriceHT);
    const basePrice = basePriceHT * (1 + formData.vatRate / 100);
    onSave({
      ...formData,
      basePriceHT,
      basePrice,
    });
  };

  const toggleConfigCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      allowedConfigCategories: prev.allowedConfigCategories.includes(category)
        ? prev.allowedConfigCategories.filter((c: string) => c !== category)
        : [...prev.allowedConfigCategories, category]
    }));
  };

  const calculatedTTC = (parseFloat(formData.basePriceHT) || 0) * (1 + formData.vatRate / 100);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{item ? 'Modifier le produit' : 'Ajouter un produit'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-md min-h-[80px] resize-y"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePriceHT">Prix HT (€) *</Label>
                <Input
                  id="basePriceHT"
                  type="number"
                  step="0.01"
                  value={formData.basePriceHT}
                  onChange={(e) => setFormData({ ...formData, basePriceHT: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate">Taux de TVA *</Label>
                <Select value={formData.vatRate.toString()} onValueChange={(value) => setFormData({ ...formData, vatRate: parseFloat(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {vatRates.map(rate => (
                      <SelectItem key={rate.value} value={rate.value.toString()}>
                        {rate.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">Prix TTC calculé:</span>
                <span className="text-xl font-bold text-primary">{calculatedTTC.toFixed(2)}€</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL de l'image</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Options de configuration disponibles</Label>
              <div className="grid grid-cols-2 gap-2">
                {configCategories.map(cat => (
                  <div key={cat.value} className="flex items-center space-x-2 p-2 border rounded-md">
                    <Switch
                      checked={formData.allowedConfigCategories.includes(cat.value)}
                      onCheckedChange={() => toggleConfigCategory(cat.value)}
                    />
                    <Label className="text-sm cursor-pointer">{cat.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
              />
              <Label>Produit disponible</Label>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
              {item ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function OptionsManager() {
  const [options, setOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingOption, setEditingOption] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://apisam.mgd-crm.com/api/config-options', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setOptions(data);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const configCategories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'taille', label: 'Taille' },
    { value: 'sauce', label: 'Sauce' },
    { value: 'supplement', label: 'Suppléments' },
    { value: 'cuisson', label: 'Cuisson' },
    { value: 'fromage', label: 'Fromage' },
    { value: 'viande', label: 'Viande' },
    { value: 'legumes', label: 'Légumes' },
  ];

  const filteredOptions = selectedCategory === 'all'
    ? options
    : options.filter(opt => opt.category === selectedCategory);

  const handleSaveOption = async (option: any) => {
    try {
      const token = localStorage.getItem('adminToken');
      const method = editingOption ? 'PUT' : 'POST';
      const url = editingOption
        ? `https://apisam.mgd-crm.com/api/config-options/${editingOption.id}`
        : 'https://apisam.mgd-crm.com/api/config-options';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(option)
      });

      if (response.ok) {
        setEditingOption(null);
        setIsAdding(false);
        fetchOptions();
      }
    } catch (error) {
      console.error('Failed to save option:', error);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette option ?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`https://apisam.mgd-crm.com/api/config-options/${optionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        fetchOptions();
      } catch (error) {
        console.error('Failed to delete option:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Options ({filteredOptions.length})</h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              {configCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOptions.map((option) => (
          <Card key={option.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{option.name}</h4>
                  <Badge variant="outline" className="text-xs mb-2">
                    {option.category}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setEditingOption(option)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteOption(option.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Prix HT:</span>
                  <span className="font-medium">{((option.priceHT || option.price / 1.1)).toFixed(2)}€</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">TVA:</span>
                  <span className="font-medium">{(option.vatRate || 10)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Prix TTC:</span>
                  <span className="font-bold text-primary">{option.price.toFixed(2)}€</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(isAdding || editingOption) && (
        <OptionForm
          option={editingOption}
          onSave={handleSaveOption}
          onCancel={() => {
            setEditingOption(null);
            setIsAdding(false);
          }}
        />
      )}
    </>
  );
}

function OptionForm({ option, onSave, onCancel }: {
  option: any;
  onSave: (option: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: option?.name || '',
    priceHT: option?.priceHT || (option?.price ? option.price / 1.1 : ''),
    vatRate: option?.vatRate || 10,
    category: option?.category || 'supplement',
  });

  const vatRates = [
    { value: 5.5, label: '5.5% - Aliments de base' },
    { value: 10, label: '10% - Repas standard' },
    { value: 20, label: '20% - Boissons, desserts' },
  ];

  const configCategories = [
    { value: 'taille', label: 'Taille' },
    { value: 'sauce', label: 'Sauce' },
    { value: 'supplement', label: 'Suppléments' },
    { value: 'cuisson', label: 'Cuisson' },
    { value: 'fromage', label: 'Fromage' },
    { value: 'viande', label: 'Viande' },
    { value: 'legumes', label: 'Légumes' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceHT = parseFloat(formData.priceHT);
    const price = priceHT * (1 + formData.vatRate / 100);
    onSave({
      ...formData,
      priceHT,
      price,
    });
  };

  const calculatedTTC = (parseFloat(formData.priceHT) || 0) * (1 + formData.vatRate / 100);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{option ? 'Modifier l\'option' : 'Ajouter une option'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {configCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceHT">Prix HT (€) *</Label>
              <Input
                id="priceHT"
                type="number"
                step="0.01"
                value={formData.priceHT}
                onChange={(e) => setFormData({ ...formData, priceHT: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatRate">Taux de TVA *</Label>
              <Select value={formData.vatRate.toString()} onValueChange={(value) => setFormData({ ...formData, vatRate: parseFloat(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {vatRates.map(rate => (
                    <SelectItem key={rate.value} value={rate.value.toString()}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">Prix TTC calculé:</span>
                <span className="text-xl font-bold text-primary">{calculatedTTC.toFixed(2)}€</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
              {option ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
