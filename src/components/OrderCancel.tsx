import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ShoppingCart, Home, Info } from 'lucide-react';

export function OrderCancel() {
  useEffect(() => {
    // Clear URL parameters without page reload
    window.history.replaceState({}, '', '/');
  }, []);

  const handleBackToCart = () => {
    // Redirect to home and open cart
    window.location.href = '/?cart=open';
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        <Card className="border-none shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-16 h-16 text-orange-600" />
            </div>
            <CardTitle className="text-4xl font-bold text-orange-700">
              Paiement Annulé
            </CardTitle>
            <CardDescription className="text-xl text-gray-600 mt-3">
              Vous avez interrompu le processus de paiement
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* What happened */}
            <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Ce qui s'est passé :</h3>
                  <p className="text-sm text-orange-700 leading-relaxed">
                    Vous avez choisi d'annuler le paiement ou la transaction a échoué.
                    <strong className="block mt-2">Aucune somme n'a été débitée de votre carte.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Cart preserved */}
            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Bonne nouvelle : votre panier est conservé !</h3>
                  <p className="text-sm text-green-700 leading-relaxed">
                    Rassurez-vous, tous vos articles sont toujours dans votre panier.
                    Vous n'avez rien perdu et pouvez continuer votre commande quand vous le souhaitez.
                  </p>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Pour continuer votre commande :</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 text-sm">Vérifiez votre panier</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Assurez-vous que tous les articles et options sont corrects
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 text-sm">Choisissez votre mode de livraison</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Sur place ou livraison à domicile
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 text-sm">Procédez au paiement</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Paiement 100% sécurisé via Stripe
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Retry options */}
            <div className="space-y-3">
              <Button
                onClick={handleBackToCart}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Retourner au panier
              </Button>

              <Button
                onClick={handleBackToHome}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-4"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>

            {/* Help text */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
              <p className="mb-2">Besoin d'aide pour finaliser votre commande ?</p>
              <p className="font-medium text-gray-700">Notre équipe est à votre disposition pour vous assister.</p>
              <p className="mt-3">À très bientôt sur Sam Pizza ! 🍕</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional help */}
        <div className="mt-6 text-center">
          <Card className="border-none shadow-md bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                <Info className="w-4 h-4" />
                <p>
                  <strong>Astuce :</strong> Vous pouvez enregistrer votre commande et payer plus tard si vous le souhaitez.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
