import { useState } from 'react';
import { MenuItem, ConfigOption, CartItem, useAppContext } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ItemConfiguratorProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemConfigurator({ item, isOpen, onClose }: ItemConfiguratorProps) {
  const { configOptions, addToCart } = useAppContext();
  const [selectedConfigs, setSelectedConfigs] = useState<ConfigOption[]>([]);
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const handleConfigToggle = (config: ConfigOption) => {
    setSelectedConfigs(prev => {
      const isSelected = prev.some(c => c.id === config.id);
      if (isSelected) {
        return prev.filter(c => c.id !== config.id);
      } else {
        // For categories like 'taille' or 'cuisson', we might want radio behavior (single selection)
        // But for simplicity, let's allow multiple or handle it via UI.
        // Let's enforce single selection for 'taille' and 'cuisson'
        if (config.category === 'taille' || config.category === 'cuisson') {
          return [...prev.filter(c => c.category !== config.category), config];
        }
        return [...prev, config];
      }
    });
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: `ci-${Date.now()}`,
      menuItem: item,
      quantity,
      configurations: selectedConfigs,
      totalPrice: (item.basePrice + selectedConfigs.reduce((sum, c) => sum + c.price, 0)) * quantity,
    };
    addToCart(cartItem);
    onClose();
    setSelectedConfigs([]);
    setQuantity(1);
  };

  const currentPrice = (item.basePrice + selectedConfigs.reduce((sum, c) => sum + c.price, 0)) * quantity;

  // Group options by category
  const optionsByCategory = item.allowedConfigCategories.reduce((acc, category) => {
    acc[category] = configOptions.filter(c => c.category === category);
    return acc;
  }, {} as Record<string, ConfigOption[]>);

  const categoryLabels: Record<string, string> = {
    taille: 'Taille',
    sauce: 'Sauces',
    supplement: 'Suppléments',
    cuisson: 'Cuisson',
    fromage: 'Fromages',
    viande: 'Viandes',
    legumes: 'Légumes'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="relative h-48 w-full shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
            <DialogTitle className="text-3xl font-oswald font-bold text-white tracking-wide drop-shadow-xl">{item.name}</DialogTitle>
            <DialogDescription className="text-gray-200 mt-1 font-bold text-lg drop-shadow-md">
              À partir de {item.basePrice.toFixed(2)}€
            </DialogDescription>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{item.description}</p>
          
          <div className="space-y-6 pb-4">
            {item.allowedConfigCategories.map(category => {
              const options = optionsByCategory[category];
              if (!options || options.length === 0) return null;
              
              const isSingleChoice = category === 'taille' || category === 'cuisson';

              return (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-sm uppercase tracking-wider text-primary">{categoryLabels[category] || category}</h4>
                  
                  {isSingleChoice ? (
                    <RadioGroup 
                      value={selectedConfigs.find(c => c.category === category)?.id}
                      onValueChange={(val) => {
                        const opt = options.find(o => o.id === val);
                        if (opt) handleConfigToggle(opt);
                      }}
                      className="space-y-2"
                    >
                      {options.map(option => (
                        <div key={option.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`config-${option.id}`} />
                            <Label htmlFor={`config-${option.id}`} className="text-sm font-normal cursor-pointer">
                              {option.name}
                            </Label>
                          </div>
                          <span className="text-sm text-gray-500">
                            {option.price > 0 ? `+${option.price.toFixed(2)}€` : 'Inclus'}
                          </span>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {options.map(option => (
                        <div key={option.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`config-${option.id}`} 
                              checked={selectedConfigs.some(c => c.id === option.id)}
                              onCheckedChange={() => handleConfigToggle(option)}
                            />
                            <Label htmlFor={`config-${option.id}`} className="text-sm font-normal cursor-pointer">
                              {option.name}
                            </Label>
                          </div>
                          <span className="text-sm text-gray-500">
                            +{option.price.toFixed(2)}€
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Quantité</span>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-none"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <span className="w-4 text-center">{quantity}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-none"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>
          <Button 
            className="w-full rounded-none bg-primary hover:bg-text-dark text-white uppercase tracking-widest font-bold h-14 text-lg" 
            size="lg"
            onClick={handleAddToCart}
          >
            Ajouter • {currentPrice.toFixed(2)}€
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
