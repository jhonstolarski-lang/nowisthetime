import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Edit } from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();

  // Form state for new content
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'video' | 'document' | 'image' | 'other'>('video');
  const [isPublic, setIsPublic] = useState(false);

  // Queries
  const { data: contentList } = trpc.content.list.useQuery();
  const { data: users } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });
  const { data: subscriptions } = trpc.admin.listSubscriptions.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  // Mutations
  const createContentMutation = trpc.admin.createContent.useMutation({
    onSuccess: () => {
      toast.success('Conteúdo criado com sucesso!');
      setTitle('');
      setDescription('');
      setUrl('');
      setType('video');
      setIsPublic(false);
      utils.content.list.invalidate();
    },
    onError: (error) => {
      toast.error('Erro ao criar conteúdo');
    },
  });

  const deleteContentMutation = trpc.admin.deleteContent.useMutation({
    onSuccess: () => {
      toast.success('Conteúdo excluído com sucesso!');
      utils.content.list.invalidate();
    },
    onError: (error) => {
      toast.error('Erro ao excluir conteúdo');
    },
  });

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Voltar para Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateContent = (e: React.FormEvent) => {
    e.preventDefault();
    createContentMutation.mutate({
      title,
      description,
      url,
      type,
      isPublic,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent">
            Painel de Administração
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/content')}
              variant="outline"
            >
              Ver Conteúdo
            </Button>
            <Button 
              onClick={() => {
                document.cookie = 'session=; Max-Age=0; path=/;';
                window.location.href = '/';
              }}
              variant="outline"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Conteúdo</CardTitle>
                <CardDescription>Crie um novo item de conteúdo para a plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateContent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">URL do Conteúdo</Label>
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="document">Documento</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isPublic" className="cursor-pointer">
                      Conteúdo público (visível sem assinatura)
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500"
                    disabled={createContentMutation.isPending}
                  >
                    {createContentMutation.isPending ? 'Criando...' : 'Criar Conteúdo'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conteúdo Existente</CardTitle>
                <CardDescription>Gerencie o conteúdo da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentList && contentList.length > 0 ? (
                    contentList.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {item.type}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${item.isPublic ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                              {item.isPublic ? 'Público' : 'Privado'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteContentMutation.mutate({ id: item.id })}
                          disabled={deleteContentMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">Nenhum conteúdo cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>Lista de todos os usuários da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users && users.length > 0 ? (
                    users.map((u) => (
                      <div 
                        key={u.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{u.name}</h3>
                          <p className="text-sm text-gray-600">{u.email}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {u.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">Nenhum usuário cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Assinaturas</CardTitle>
                <CardDescription>Lista de todas as assinaturas da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptions && subscriptions.length > 0 ? (
                    subscriptions.map((sub) => (
                      <div 
                        key={sub.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">Assinatura #{sub.id}</h3>
                          <p className="text-sm text-gray-600">Plano: {sub.planType}</p>
                          <p className="text-sm text-gray-600">
                            Valor: R$ {(sub.amount / 100).toFixed(2)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          sub.status === 'active' ? 'bg-green-100 text-green-800' :
                          sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">Nenhuma assinatura cadastrada</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
