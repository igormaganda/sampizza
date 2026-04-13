import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Package, Clock, Home } from 'lucide-react';

export function PaymentSuccess() {
  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const handleTrackOrder = () => {
    window.location.href = '/suivi';
  };

  useEffect(() => {
    // Clear the URL parameters without triggering a page reload
    window.history.replaceState({}, '', '/');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">
        <Card className="border-none shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-700">
              Paiement Réussi !
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Votre commande a été confirmée avec succès
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Commande confirmée</h3>
                  <p className="text-sm text-green-700">
                    Votre commande est maintenant en cours de préparation. Vous recevrez bientôt votre pizza !
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Délai de préparation</h3>
                  <p className="text-sm text-blue-700">
                    En moyenne, vos commandes sont prêtes en 15-20 minutes. Vous pourrez suivre l'avancement en temps réel.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Ce qui se passe ensuite :</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Confirmation de votre paiement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">→</span>
                  <span>Préparation de votre commande par nos équipes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">→</span>
                  <span>Votre commande est prête !</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">★</span>
                  <span>Dégustation de votre délicieuse pizza</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBackToHome}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Un email de confirmation a été envoyé à votre adresse.</p>
              <p className="mt-1">Merci pour votre confiance ! 🍕</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Besoin d'aide ?{' '}
            <button
              onClick={handleTrackOrder}
              className="text-green-600 hover:underline font-medium"
            >
              Suivre ma commande
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
