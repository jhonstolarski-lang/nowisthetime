import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { ChevronDown, ChevronUp } from 'lucide-react';

const plans = [
  {
    id: 'monthly',
    name: '1 mês',
    discount: '30% off',
    price: 19.90,
    isPromotion: false,
  },
  {
    id: '3months',
    name: '3 meses',
    discount: '39% off',
    price: 29.90,
    isPromotion: true,
  },
  {
    id: '6months',
    name: '6 meses',
    discount: '75% off',
    price: 59.90,
    isPromotion: true,
  },
];

export default function Subscribe() {
  const [showPromotions, setShowPromotions] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string>('');
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const { user } = useAuth();
  const [, navigate] = useLocation();


  const createPaymentMutation = trpc.subscription.createPixPayment.useMutation({
    onSuccess: (data) => {
      setPixCode(data.pixCode);
      setPixQrCode(data.pixQrCodeBase64);
      toast.success('Pagamento criado! Use o código Pix abaixo para finalizar o pagamento');
    },
    onError: (error) => {
      toast.error('Erro ao criar pagamento');
    },
  });

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      toast.error('Login necessário. Faça login para assinar');
      navigate('/auth');
      return;
    }

    setSelectedPlan(planId);
    createPaymentMutation.mutate({ planType: 'monthly' }); // All plans are monthly for now
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success('Código Pix copiado!');
  };

  if (pixCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 p-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Finalize seu pagamento</CardTitle>
              <CardDescription>
                Escaneie o QR Code ou copie o código Pix abaixo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pixQrCode && (
                <div className="flex justify-center">
                  <img 
                    src={`data:image/png;base64,${pixQrCode}`} 
                    alt="QR Code Pix" 
                    className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Código Pix Copia e Cola:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixCode}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm font-mono"
                  />
                  <Button onClick={handleCopyPix}>
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-900 mb-2">Instruções:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha a opção Pix</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                  <li>Aguarde a confirmação (pode levar alguns minutos)</li>
                </ol>
              </div>

              <Button 
                onClick={() => navigate('/content')}
                className="w-full"
                variant="outline"
              >
                Voltar para o conteúdo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 p-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent">
            Escolha seu plano
          </h1>
          <p className="text-gray-600">
            Acesse todo o conteúdo exclusivo
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Assinaturas</h2>
          
          {/* Plan 1 - Monthly */}
          <button
            onClick={() => handleSelectPlan('monthly')}
            disabled={createPaymentMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 rounded-full p-6 flex items-center justify-between transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <div className="text-left">
              <span className="text-xl font-bold text-gray-900">
                1 mês <span className="text-base font-normal">(30% off)</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">R$ 19,90</span>
            </div>
          </button>

          {/* Promotions Section */}
          <div className="space-y-4">
            <button
              onClick={() => setShowPromotions(!showPromotions)}
              className="w-full flex items-center justify-between text-2xl font-bold text-gray-900"
            >
              <span>Promoções</span>
              {showPromotions ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </button>

            {showPromotions && (
              <div className="space-y-4">
                {/* Plan 2 - 3 months */}
                <button
                  onClick={() => handleSelectPlan('3months')}
                  disabled={createPaymentMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 rounded-full p-6 flex items-center justify-between transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <div className="text-left">
                    <span className="text-xl font-bold text-gray-900">
                      3 meses <span className="text-base font-normal">(39% off)</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">R$ 29,90</span>
                  </div>
                </button>

                {/* Plan 3 - 6 months */}
                <button
                  onClick={() => handleSelectPlan('6months')}
                  disabled={createPaymentMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 rounded-full p-6 flex items-center justify-between transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <div className="text-left">
                    <span className="text-xl font-bold text-gray-900">
                      6 meses <span className="text-base font-normal">(75% off)</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">R$ 59,90</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {!user && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Você precisa estar logado para assinar
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500"
            >
              Fazer Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
