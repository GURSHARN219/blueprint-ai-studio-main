import { useState, useEffect } from "react";
import { Settings, Plus, Trash2, Edit2, Save, X, Check, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Provider, ProviderType, PROVIDER_MODELS, DEFAULT_BASE_URLS } from "@/lib/ai-config";

export function SettingsDialog() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [newProvider, setNewProvider] = useState<Partial<Provider>>({
    name: 'OpenAI',
    model: 'gpt-4o',
    apiKey: '',
    baseUrl: DEFAULT_BASE_URLS['OpenAI']
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Provider>>({});
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [availableModels, setAvailableModels] = useState<{id: string, name: string, isFree?: boolean}[]>([]);
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Load providers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-providers');
    if (saved) {
      try {
        setProviders(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse providers", e);
      }
    }
  }, []);

  // Save providers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ai-providers', JSON.stringify(providers));
  }, [providers]);

  const verifyApiKey = async (provider: Partial<Provider>) => {
    if (!provider.apiKey || !provider.name) return;
    
    setVerificationStatus('loading');
    try {
      let url = '';
      const headers: Record<string, string> = {};
      const baseUrl = provider.baseUrl || DEFAULT_BASE_URLS[provider.name as ProviderType];
      
      if (provider.name === 'OpenAI' || provider.name === 'OpenRouter') {
        url = `${baseUrl}/models`;
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      } else if (provider.name === 'Anthropic') {
        url = `${baseUrl}/models?limit=100`;
        headers['x-api-key'] = provider.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
      } else if (provider.name === 'Google') {
        url = `${baseUrl}/models?key=${provider.apiKey}`;
      }

      const response = await fetch(url, { headers });
      
      if (response.ok) {
        const data = await response.json();
        let models: {id: string, name: string, isFree?: boolean}[] = [];

        if (provider.name === 'OpenRouter' && data.data) {
           models = data.data.map((m: { id: string; name?: string; pricing?: { prompt?: string; completion?: string } }) => ({ 
             id: m.id, 
             name: m.name || m.id,
             isFree: m.pricing?.prompt === "0" && m.pricing?.completion === "0"
           }));
        } else if (provider.name === 'OpenAI' && data.data) {
           models = data.data.map((m: { id: string }) => ({ id: m.id, name: m.id }));
        } else if (provider.name === 'Google' && data.models) {
           models = data.models.map((m: { name: string; displayName?: string }) => ({ 
             id: m.name.replace('models/', ''), 
             name: m.displayName || m.name 
           }));
        } else if (provider.name === 'Anthropic' && data.data) {
           models = data.data.map((m: { id: string }) => ({ id: m.id, name: m.id }));
        }

        if (models.length > 0) {
            models.sort((a, b) => a.name.localeCompare(b.name));
            setAvailableModels(models);
        }

        setVerificationStatus('success');
        toast.success("Verified & models fetched!");
      } else {
        throw new Error("Verification failed");
      }
    } catch (error) {
      console.error(error);
      setVerificationStatus('error');
      toast.error("Failed to verify/fetch models");
    }
  };

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.model || !newProvider.apiKey) {
      toast.error("Please fill in all required fields");
      return;
    }

    const provider: Provider = {
      id: crypto.randomUUID(),
      name: newProvider.name as ProviderType,
      model: newProvider.model,
      apiKey: newProvider.apiKey,
      baseUrl: newProvider.baseUrl || DEFAULT_BASE_URLS[newProvider.name as ProviderType]
    };

    setProviders([...providers, provider]);
    setNewProvider({
      name: 'OpenAI',
      model: 'gpt-4o',
      apiKey: '',
      baseUrl: DEFAULT_BASE_URLS['OpenAI']
    });
    toast.success("Provider added successfully");
  };

  const handleDeleteProvider = (id: string) => {
    setProviders(providers.filter(p => p.id !== id));
    toast.success("Provider removed");
  };

  const startEditing = (provider: Provider) => {
    setEditingId(provider.id);
    setEditForm({ ...provider });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (!editForm.name || !editForm.model || !editForm.apiKey) {
      toast.error("Please fill in all required fields");
      return;
    }

    setProviders(providers.map(p => p.id === editingId ? { ...editForm, id: p.id } as Provider : p));
    setEditingId(null);
    setEditForm({});
    toast.success("Provider updated");
  };

  const handleProviderTypeChange = (value: ProviderType, isEditing: boolean = false) => {
    setVerificationStatus('idle');
    const defaultModel = PROVIDER_MODELS[value][0];
    const defaultBaseUrl = DEFAULT_BASE_URLS[value];
    
    if (isEditing) {
      setEditForm(prev => ({
        ...prev,
        name: value,
        model: defaultModel,
        baseUrl: defaultBaseUrl
      }));
    } else {
      setNewProvider(prev => ({
        ...prev,
        name: value,
        model: defaultModel,
        baseUrl: defaultBaseUrl
      }));
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-1.5">
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            API Providers Settings
          </DialogTitle>
          <DialogDescription>
            Add multiple AI model providers. Configure API keys, models, and manage them easily.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add New Provider Section */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New Provider
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider Name</Label>
                <Select 
                  value={newProvider.name} 
                  onValueChange={(v) => handleProviderTypeChange(v as ProviderType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Anthropic">Anthropic</SelectItem>
                    <SelectItem value="OpenRouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Model</Label>
                  {availableModels.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="free-only" 
                        checked={showFreeOnly}
                        onCheckedChange={(c) => setShowFreeOnly(!!c)}
                      />
                      <Label htmlFor="free-only" className="text-xs font-normal cursor-pointer">Free only</Label>
                    </div>
                  )}
                </div>
                <Select 
                  value={newProvider.model} 
                  onValueChange={(v) => setNewProvider(prev => ({ ...prev, model: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableModels.length > 0 ? availableModels : (newProvider.name ? PROVIDER_MODELS[newProvider.name as ProviderType].map(m => ({id: m, name: m, isFree: false})) : [])).filter(m => !showFreeOnly || m.isFree).map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <span className="flex items-center gap-2">
                          {model.name}
                          {model.isFree && <span className="text-[10px] bg-green-500/20 text-green-500 px-1 rounded">Free</span>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input 
                    type="password" 
                    value={newProvider.apiKey}
                    onChange={(e) => {
                      setNewProvider(prev => ({ ...prev, apiKey: e.target.value }));
                      setVerificationStatus('idle');
                    }}
                    placeholder="sk-..."
                    className="pr-24"
                  />
                  <div className="absolute right-1 top-1 flex items-center gap-1">
                    {verificationStatus === 'success' && <Check className="w-4 h-4 text-green-500" />}
                    {verificationStatus === 'error' && <X className="w-4 h-4 text-red-500" />}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs"
                      onClick={() => verifyApiKey(newProvider)}
                      disabled={verificationStatus === 'loading' || !newProvider.apiKey}
                    >
                      {verificationStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                </div>
              </div>

              {(newProvider.name === 'OpenRouter' || !DEFAULT_BASE_URLS[newProvider.name as ProviderType]) && (
                <div className="space-y-2 col-span-2">
                  <Label>Base URL (Optional)</Label>
                  <Input 
                    value={newProvider.baseUrl}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              )}
              
              {newProvider.name !== 'OpenRouter' && (
                 <div className="space-y-2 col-span-2">
                  <Label>Base URL</Label>
                  <Input 
                    value={newProvider.baseUrl}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                </div>
              )}
            </div>

            <Button onClick={handleAddProvider} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Add Provider
            </Button>
          </div>

          {/* Saved Providers List */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Saved Providers</h3>
            
            {providers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
                No providers added yet.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => (
                      <TableRow key={provider.id}>
                        {editingId === provider.id ? (
                          <>
                            <TableCell>
                              <Select 
                                value={editForm.name} 
                                onValueChange={(v) => handleProviderTypeChange(v as ProviderType, true)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="OpenAI">OpenAI</SelectItem>
                                  <SelectItem value="Google">Google</SelectItem>
                                  <SelectItem value="Anthropic">Anthropic</SelectItem>
                                  <SelectItem value="OpenRouter">OpenRouter</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={editForm.model} 
                                onValueChange={(v) => setEditForm(prev => ({ ...prev, model: v }))}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {editForm.name && PROVIDER_MODELS[editForm.name as ProviderType].map(model => (
                                    <SelectItem key={model} value={model}>{model}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="password" 
                                value={editForm.apiKey}
                                onChange={(e) => setEditForm(prev => ({ ...prev, apiKey: e.target.value }))}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={saveEditing}>
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={cancelEditing}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{provider.name}</TableCell>
                            <TableCell>{provider.model}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {provider.apiKey.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(provider)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProvider(provider.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
