import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Lock, Video, FileText, Image as ImageIcon, File } from 'lucide-react';

const iconMap = {
  video: Video,
  document: FileText,
  image: ImageIcon,
  other: File,
};

export default function Content() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: contentList, isLoading } = trpc.content.list.useQuery();
  const { data: subscription } = trpc.subscription.getMine.useQuery(undefined, {
    enabled: !!user,
  });

  const hasActiveSubscription = subscription?.status === 'active';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent">
            Plataforma Lia Vasconcelos
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">Olá, {user.name}</span>
                {user.role === 'admin' && (
                  <Button 
                    onClick={() => navigate('/admin')}
                    variant="outline"
                    size="sm"
                  >
                    Painel Admin
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    document.cookie = 'session=; Max-Age=0; path=/;';
                    window.location.href = '/';
                  }}
                  variant="outline"
                  size="sm"
                >
                  Sair
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Subscription Status */}
        {user && !hasActiveSubscription && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Assine para acessar todo o conteúdo
              </CardTitle>
              <CardDescription>
                Você ainda não possui uma assinatura ativa. Assine agora para ter acesso completo!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/subscribe')}
                className="bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500"
              >
                Ver Planos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Content Grid */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">
            {hasActiveSubscription ? 'Conteúdo Exclusivo' : 'Prévia do Conteúdo'}
          </h2>
          
          {contentList && contentList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentList.map((item) => {
                const Icon = iconMap[item.type];
                const isLocked = !item.isPublic && !hasActiveSubscription && user?.role !== 'admin';
                
                return (
                  <Card 
                    key={item.id}
                    className={`hover:shadow-lg transition-shadow ${isLocked ? 'opacity-60' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className="w-8 h-8 text-pink-500" />
                        {isLocked && <Lock className="w-5 h-5 text-gray-400" />}
                      </div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLocked ? (
                        <Button 
                          onClick={() => navigate('/subscribe')}
                          className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500"
                        >
                          Assinar para acessar
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => window.open(item.url, '_blank')}
                          className="w-full"
                        >
                          Acessar Conteúdo
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">Nenhum conteúdo disponível no momento.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
