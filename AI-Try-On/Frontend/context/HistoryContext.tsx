
import React, { createContext, useContext, useState, useEffect } from 'react';

interface HistoryItem {
    _id?: string;
    modelImage: string;
    resultImages: string[];
    prompt: string;
    type: string;
    createdAt: string;
}

interface HistoryContextType {
    history: HistoryItem[];
    loading: boolean;
    addHistory: (item: any) => Promise<void>;
    addVirtualModel: (item: any) => Promise<void>;
    updateVirtualModel: (id: string, item: any) => Promise<void>;
    deleteVirtualModel: (id: string, type: string) => Promise<void>;
    removeImageFromRecord: (id: string, type: string, imageUrl: string) => Promise<void>;
    addTryOn: (item: any) => Promise<void>;
    updateTryOn: (id: string, item: any) => Promise<void>;
    deleteTryOn: (id: string) => Promise<void>;
    fetchHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const [vmRes, tryOnRes] = await Promise.all([
                fetch('/api/virtual-models'),
                fetch('/api/try-ons')
            ]);
            
            const vms = await vmRes.json();
            const tryOns = await tryOnRes.json();

            const combined = [
                ...vms.map((i: any) => ({ ...i, type: 'virtual-model' })),
                ...tryOns.map((i: any) => ({ ...i, type: 'try-on' }))
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setHistory(combined);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const addHistory = async (item: any) => {
        // Redirect legacy calls to appropriate handlers or just ignore
        if (item.type === 'virtual-model') {
            await addVirtualModel(item);
        } else if (item.type === 'try-on') {
            await addTryOn(item);
        }
    };

    const addVirtualModel = async (item: any) => {
        try {
            const response = await fetch('/api/virtual-models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            const data = await response.json();
            console.log("Virtual Model saved successfully:", data);
            // Transform to match HistoryItem if needed for UI session display
            setHistory(prev => [{
                ...data,
                type: 'virtual-model',
                prompt: data.prompt
            }, ...prev]);
        } catch (error) {
            console.error("Failed to add virtual model:", error);
        }
    };

    const updateVirtualModel = async (id: string, item: any) => {
        try {
            const response = await fetch(`/api/virtual-models/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            const data = await response.json();
            console.log("Virtual Model updated successfully:", data);
            setHistory(prev => prev.map(h => h._id === id ? { ...data, type: 'virtual-model' } : h));
        } catch (error) {
            console.error("Failed to update virtual model:", error);
        }
    };

    const deleteVirtualModel = async (id: string, type: string) => {
        try {
            const endpoint = type === 'virtual-model' ? '/api/virtual-models' : '/api/try-ons';
            const response = await fetch(`${endpoint}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error("Failed to delete");
            setHistory(prev => prev.filter(h => h._id !== id));
        } catch (error) {
            console.error("Failed to delete record:", error);
        }
    };

    const removeImageFromRecord = async (id: string, type: string, imageUrl: string) => {
        try {
            const endpoint = type === 'virtual-model' ? `/api/virtual-models/${id}/remove-image` : `/api/try-ons/${id}/remove-image`;
            
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl })
            });

            if (!response.ok) throw new Error("Failed to remove image");
            
            const updatedData = await response.json();
            setHistory(prev => prev.map(h => h._id === id ? { ...updatedData, type } : h));
        } catch (error) {
            console.error("Failed to remove image from record:", error);
        }
    };

    const addTryOn = async (item: any) => {
        try {
            const response = await fetch('/api/try-ons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            const data = await response.json();
            console.log("Try-On saved successfully:", data);
            setHistory(prev => [{
                ...data,
                type: 'try-on'
            }, ...prev]);
        } catch (error) {
            console.error("Failed to add try-on:", error);
        }
    };

    const deleteTryOn = async (id: string) => {
        try {
            const response = await fetch(`/api/try-ons/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            console.log("Try-On deleted successfully");
            setHistory(prev => prev.filter(h => h._id !== id));
        } catch (error) {
            console.error("Failed to delete try-on:", error);
        }
    };

    const updateTryOn = async (id: string, item: any) => {
        try {
            const response = await fetch(`/api/try-ons/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            const data = await response.json();
            console.log("Try-On updated successfully:", data);
            setHistory(prev => prev.map(h => h._id === id ? { ...data, type: 'try-on' } : h));
        } catch (error) {
            console.error("Failed to update try-on:", error);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <HistoryContext.Provider value={{ 
            history, 
            loading, 
            addHistory, 
            addVirtualModel, 
            updateVirtualModel,
            deleteVirtualModel,
            removeImageFromRecord,
            addTryOn, 
            updateTryOn,
            deleteTryOn,
            fetchHistory 
        }}>
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) throw new Error("useHistory must be used within a HistoryProvider");
    return context;
};
