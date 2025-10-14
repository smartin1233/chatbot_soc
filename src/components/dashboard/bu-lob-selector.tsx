'use client';

import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Folder, PlusCircle, UploadCloud, CheckCircle, FileWarning, Plug, Check, Eye, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from './app-provider';
import type { BusinessUnit, LineOfBusiness, BUCreationData, LOBCreationData } from '@/lib/types';
import { agentResponseGenerator } from '@/lib/agent-response-generator';
import { dataValidationEngine } from '@/lib/data-validation-engine';
import ColumnMappingDialog from './column-mapping-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

function AddBuDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
    const [formData, setFormData] = useState<BUCreationData>({
        name: '',
        description: '',
        code: '',
        startDate: new Date(),
        displayName: ''
    });
    const [errors, setErrors] = useState<Partial<Record<keyof BUCreationData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const { dispatch } = useApp();

    // AI-powered auto-fill for missing fields
    const handleAutoFill = async () => {
        if (!formData.name.trim()) {
            alert('Please enter a Business Unit name first');
            return;
        }

        setIsAutoFilling(true);
        try {
            // Generate intelligent defaults based on the name
            const name = formData.name.trim();
            
            // Auto-generate code from name
            const autoCode = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            
            // Auto-generate display name (title case)
            const autoDisplayName = name.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            
            // Auto-generate description using AI-like logic
            const autoDescription = `Business Unit for ${name} operations and management. Handles forecasting, data analysis, and reporting for ${name} activities.`;

            // Update form with auto-generated values (only if empty)
            setFormData(prev => ({
                ...prev,
                code: prev.code.trim() ? prev.code : autoCode,
                displayName: prev.displayName.trim() ? prev.displayName : autoDisplayName,
                description: prev.description.trim() ? prev.description : autoDescription,
            }));

            // Show success message
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `🤖 **AI Auto-Fill Complete!**\n\nI've generated the following fields for "${name}":\n• **Code:** ${autoCode}\n• **Display Name:** ${autoDisplayName}\n• **Description:** ${autoDescription}\n\nYou can edit these before creating the Business Unit.`,
                }
            });
        } catch (error) {
            console.error('Auto-fill error:', error);
        } finally {
            setIsAutoFilling(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof BUCreationData, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Business Unit name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Code is required';
        } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
            newErrors.code = 'Code must contain only uppercase letters, numbers, and underscores';
        }

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        // Auto-generate missing fields
        const enhancedFormData = { ...formData };

        if (!enhancedFormData.code.trim()) {
            enhancedFormData.code = `BU_${formData.name.toUpperCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
        }

        if (!enhancedFormData.description.trim()) {
            enhancedFormData.description = `Business Unit for ${formData.name} operations and management`;
        }

        if (!enhancedFormData.displayName.trim()) {
            enhancedFormData.displayName = formData.name;
        }

        // Only validate name as required
        if (!formData.name.trim()) {
            setErrors({ name: 'Business Unit name is required' });
            return;
        }

        setIsSubmitting(true);
        try {
            // Import API client
            const { getAPIClient } = await import('@/lib/api-client');
            const apiClient = getAPIClient();

            // Re-authenticate to ensure token is valid
            const username = typeof window !== 'undefined' 
                ? localStorage.getItem('zentere_username') || 'martin@demo.com'
                : 'martin@demo.com';
            const password = typeof window !== 'undefined'
                ? localStorage.getItem('zentere_password') || 'demo'
                : 'demo';
            
            await apiClient.authenticate(username, password);

            // Create BU in backend
            const buId = await apiClient.createBusinessUnit({
                name: enhancedFormData.name,
                display_name: enhancedFormData.displayName,
                code: enhancedFormData.code,
                start_date: enhancedFormData.startDate.toISOString().split('T')[0],
                description: enhancedFormData.description,
            });

            console.log('✅ Created BU with ID:', buId);

            // Add to local state with the real ID
            dispatch({ type: 'ADD_BU', payload: { ...enhancedFormData, id: buId.toString() } });

            // Show success message
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `✅ **Business Unit Created Successfully!**\n\n**Stored Information:**\n• **ID:** ${buId}\n• **Name:** ${enhancedFormData.name}\n• **Display Name:** ${enhancedFormData.displayName}\n• **Code:** ${enhancedFormData.code}\n• **Description:** ${enhancedFormData.description}\n• **Start Date:** ${enhancedFormData.startDate.toLocaleDateString()}\n\n${enhancedFormData.code !== formData.code ? '🤖 *Code was auto-generated*\n' : ''}${enhancedFormData.description !== formData.description ? '🤖 *Description was auto-generated*\n' : ''}${enhancedFormData.displayName !== formData.displayName ? '🤖 *Display name was auto-generated*\n' : ''}\n✅ **Saved to backend database!**`,
                    suggestions: ['Create Line of Business', 'View Business Units', 'Upload Data']
                }
            });

            onOpenChange(false);
            // Reset form
            setFormData({
                name: '',
                description: '',
                code: '',
                startDate: new Date(),
                displayName: ''
            });
            setErrors({});
        } catch (error) {
            console.error('Failed to create Business Unit:', error);
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `❌ **Failed to create Business Unit**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support.`,
                    suggestions: ['Try again', 'Check connection', 'Contact support']
                }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof BUCreationData, value: string | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Business Unit</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        💡 Tip: Just enter a name and click "AI Auto-Fill" to generate other fields automatically
                    </p>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name *</Label>
                        <div className="col-span-3 space-y-2">
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={cn(errors.name && "border-red-500")}
                                placeholder="Enter business unit name"
                            />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                            {formData.name.trim() && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAutoFill}
                                    disabled={isAutoFilling || isSubmitting}
                                    className="w-full mt-2"
                                >
                                    {isAutoFilling ? (
                                        <>
                                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            AI Auto-Fill Other Fields
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="displayName" className="text-right">Display Name *</Label>
                        <div className="col-span-3">
                            <Input
                                id="displayName"
                                value={formData.displayName}
                                onChange={(e) => handleInputChange('displayName', e.target.value)}
                                className={cn(errors.displayName && "border-red-500")}
                                placeholder="Enter display name"
                            />
                            {errors.displayName && <p className="text-sm text-red-500 mt-1">{errors.displayName}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">Code *</Label>
                        <div className="col-span-3">
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                                className={cn(errors.code && "border-red-500")}
                                placeholder="BU_CODE_123"
                            />
                            {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description *</Label>
                        <div className="col-span-3">
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className={cn(errors.description && "border-red-500")}
                                placeholder="Describe this business unit"
                            />
                            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">Start Date *</Label>
                        <div className="col-span-3">
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate.toISOString().split('T')[0]}
                                onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
                                className={cn(errors.startDate && "border-red-500")}
                            />
                            {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Business Unit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddLobDialog({ isOpen, onOpenChange, buId }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void, buId: string | null }) {
    const [formData, setFormData] = useState<LOBCreationData>({
        name: '',
        description: '',
        code: '',
        businessUnitId: buId || '',
        startDate: new Date()
    });
    const [errors, setErrors] = useState<Partial<Record<keyof LOBCreationData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);

    // AI-powered auto-fill for missing fields
    const handleAutoFill = async () => {
        if (!formData.name.trim()) {
            alert('Please enter a Line of Business name first');
            return;
        }

        setIsAutoFilling(true);
        try {
            const name = formData.name.trim();
            
            // Auto-generate code from name
            const autoCode = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            
            // Auto-generate description
            const autoDescription = `Line of Business for ${name} operations and forecasting. Manages data collection, analysis, and predictions for ${name} activities.`;

            // Update form with auto-generated values (only if empty)
            setFormData(prev => ({
                ...prev,
                code: prev.code.trim() ? prev.code : autoCode,
                description: prev.description.trim() ? prev.description : autoDescription,
            }));

            // Show success message
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `🤖 **AI Auto-Fill Complete!**\n\nI've generated the following fields for "${name}":\n• **Code:** ${autoCode}\n• **Description:** ${autoDescription}\n\nYou can edit these before creating the Line of Business.`,
                }
            });
        } catch (error) {
            console.error('Auto-fill error:', error);
        } finally {
            setIsAutoFilling(false);
        }
    };
    const { state, dispatch } = useApp();

    // Update businessUnitId when buId prop changes
    React.useEffect(() => {
        if (buId) {
            setFormData(prev => ({ ...prev, businessUnitId: buId }));
        }
    }, [buId]);

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof LOBCreationData, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Line of Business name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Code is required';
        } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
            newErrors.code = 'Code must contain only uppercase letters, numbers, and underscores';
        }

        if (!formData.businessUnitId) {
            newErrors.businessUnitId = 'Business Unit selection is required';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        // Auto-generate missing fields
        const enhancedFormData = { ...formData };

        if (!enhancedFormData.code.trim()) {
            enhancedFormData.code = `LOB_${formData.name.toUpperCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
        }

        if (!enhancedFormData.description.trim()) {
            enhancedFormData.description = `Line of Business for ${formData.name} operations and forecasting`;
        }

        // Only validate name and business unit as required
        if (!formData.name.trim()) {
            setErrors({ name: 'Line of Business name is required' });
            return;
        }

        if (!formData.businessUnitId) {
            setErrors({ businessUnitId: 'Business Unit selection is required' });
            return;
        }

        setIsSubmitting(true);
        try {
            // Import API client
            const { getAPIClient } = await import('@/lib/api-client');
            const apiClient = getAPIClient();

            // Re-authenticate to ensure token is valid
            const username = typeof window !== 'undefined' 
                ? localStorage.getItem('zentere_username') || 'martin@demo.com'
                : 'martin@demo.com';
            const password = typeof window !== 'undefined'
                ? localStorage.getItem('zentere_password') || 'demo'
                : 'demo';
            
            await apiClient.authenticate(username, password);

            const selectedBU = state.businessUnits.find(bu => bu.id === enhancedFormData.businessUnitId);

            // Create LOB in backend
            const lobId = await apiClient.createLOB({
                name: enhancedFormData.name,
                code: enhancedFormData.code,
                business_unit_id: parseInt(enhancedFormData.businessUnitId),
                start_date: enhancedFormData.startDate.toISOString().split('T')[0],
                description: enhancedFormData.description,
            });

            console.log('✅ Created LOB with ID:', lobId);

            // Add to local state with the real ID
            dispatch({ type: 'ADD_LOB', payload: { ...enhancedFormData, id: lobId.toString() } });

            // Show success message
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `✅ **Line of Business Created Successfully!**\n\n**Stored Information:**\n• **ID:** ${lobId}\n• **Name:** ${enhancedFormData.name}\n• **Code:** ${enhancedFormData.code}\n• **Description:** ${enhancedFormData.description}\n• **Business Unit:** ${selectedBU?.name || 'Unknown'}\n• **Start Date:** ${enhancedFormData.startDate.toLocaleDateString()}\n\n${enhancedFormData.code !== formData.code ? '🤖 *Code was auto-generated*\n' : ''}${enhancedFormData.description !== formData.description ? '🤖 *Description was auto-generated*\n' : ''}\n✅ **Saved to backend database!**`,
                    suggestions: ['Upload Data to LOB', 'Create Another LOB', 'View LOBs']
                }
            });

            onOpenChange(false);
            // Reset form
            setFormData({
                name: '',
                description: '',
                code: '',
                businessUnitId: buId || '',
                startDate: new Date()
            });
            setErrors({});
        } catch (error) {
            console.error('Failed to create Line of Business:', error);
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `❌ **Failed to create Line of Business**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support.`,
                    suggestions: ['Try again', 'Check connection', 'Contact support']
                }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof LOBCreationData, value: string | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const selectedBU = state.businessUnits.find(bu => bu.id === formData.businessUnitId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Line of Business</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        💡 Tip: Just enter a name and click "AI Auto-Fill" to generate other fields
                    </p>
                    {selectedBU && (
                        <p className="text-sm text-muted-foreground">
                            Adding to Business Unit: <strong>{selectedBU.name}</strong>
                        </p>
                    )}
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lob-name" className="text-right">Name *</Label>
                        <div className="col-span-3">
                            <Input
                                id="lob-name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={cn(errors.name && "border-red-500")}
                                placeholder="Enter line of business name"
                            />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lob-code" className="text-right">Code *</Label>
                        <div className="col-span-3">
                            <Input
                                id="lob-code"
                                value={formData.code}
                                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                                className={cn(errors.code && "border-red-500")}
                                placeholder="LOB_CODE_123"
                            />
                            {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lob-description" className="text-right">Description *</Label>
                        <div className="col-span-3">
                            <Input
                                id="lob-description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className={cn(errors.description && "border-red-500")}
                                placeholder="Describe this line of business"
                            />
                            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lob-startDate" className="text-right">Start Date *</Label>
                        <div className="col-span-3">
                            <Input
                                id="lob-startDate"
                                type="date"
                                value={formData.startDate.toISOString().split('T')[0]}
                                onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
                                className={cn(errors.startDate && "border-red-500")}
                            />
                            {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Line of Business'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function BuLobSelector({
    compact = false,
    className,
    variant = 'ghost',
    size = 'default',
    triggerLabel,
}: { compact?: boolean; className?: string; variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'; size?: 'sm' | 'default' | 'lg' | 'icon'; triggerLabel?: string; }) {
    const { state, dispatch } = useApp();
    const { businessUnits, selectedBu, selectedLob, isProcessing } = state;
    
    // Check if data is still loading
    const isLoading = isProcessing && businessUnits.length === 0;
    
    // Debug: Log business units when they change
    React.useEffect(() => {
        console.log('🔍 BU/LOB Selector - businessUnits:', businessUnits.length, businessUnits);
    }, [businessUnits]);
    const [isAddBuOpen, setAddBuOpen] = useState(false);
    const [isAddLobOpen, setAddLobOpen] = useState(false);
    const [currentBuForLob, setCurrentBuForLob] = useState<string | null>(null);
    const [columnMappingOpen, setColumnMappingOpen] = useState(false);
    const [pendingUpload, setPendingUpload] = useState<{
        file: File;
        lobId: string;
        columns: string[];
        dataPreview: any[];
    } | null>(null);
    const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});


    const handleBuSelect = async (bu: BusinessUnit) => {
        dispatch({ type: 'SET_SELECTED_BU', payload: bu });
        if (bu.lobs.length > 0) {
            handleLobSelect(bu.lobs[0], bu);
        } else {
            dispatch({ type: 'SET_SELECTED_LOB', payload: null });

            // Generate professional response for BU choice
            const response = await agentResponseGenerator.generateResponse({
                intent: 'bu_selected',
                data: {
                    name: bu.name,
                    code: bu.code,
                    lobCount: bu.lobs.length,
                    totalRecords: 0,
                    lobsWithData: 0
                }
            });

            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: response.content,
                    suggestions: response.nextActions.map(action => action.text)
                }
            });
        }
    };

    const handleLobSelect = async (lob: LineOfBusiness, bu: BusinessUnit) => {
        // Don't reset workflow - let it continue if active
        // dispatch({ type: 'RESET_WORKFLOW' });
        dispatch({ type: 'SET_SELECTED_BU', payload: bu });
        dispatch({ type: 'SET_SELECTED_LOB', payload: lob });

        // Show data preview with actual data
        if (lob.hasData && lob.timeSeriesData && lob.timeSeriesData.length > 0) {
            // Get first 10 and last 10 records for preview
            const previewData = [
                ...lob.timeSeriesData.slice(0, 10),
                ...(lob.timeSeriesData.length > 20 ? lob.timeSeriesData.slice(-10) : [])
            ];

            // Format date range
            const firstDate = lob.timeSeriesData[0].Date;
            const lastDate = lob.timeSeriesData[lob.timeSeriesData.length - 1].Date;
            const dateRange = `${new Date(firstDate).toLocaleDateString()} to ${new Date(lastDate).toLocaleDateString()}`;

            // Calculate statistics
            const values = lob.timeSeriesData.map(d => d.Value);
            const avgValue = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
            const minValue = Math.min(...values).toFixed(2);
            const maxValue = Math.max(...values).toFixed(2);

            // Create preview table
            const previewTable = previewData.slice(0, 10).map(row => 
                `| ${new Date(row.Date).toLocaleDateString()} | ${row.Value.toLocaleString()} |`
            ).join('\n');

            // Calculate data insights
            const dataSpan = lob.recordCount > 0 ? Math.ceil((new Date(lob.timeSeriesData[lob.timeSeriesData.length - 1].Date).getTime() - new Date(lob.timeSeriesData[0].Date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
            const valueRange = maxValue && minValue ? ((parseFloat(maxValue.replace(/,/g, '')) - parseFloat(minValue.replace(/,/g, ''))) / parseFloat(minValue.replace(/,/g, '')) * 100).toFixed(1) : '0';
            
            const content = `## ✅ ${lob.name} - Data Loaded Successfully

**${bu.name}** • **${lob.code || 'LOB'}** • ${lob.recordCount.toLocaleString()} records

### 📊 Dataset Summary

**Coverage:** ${dataSpan} months of historical data (${dateRange})

**Key Metrics:**
• Average: **${avgValue}** per period
• Range: ${minValue} - ${maxValue} (${valueRange}% variation)
• Data Quality: **${lob.dataQuality?.trend || 'Stable'}** trend detected

### 🎯 What You Can Do Next

**Analysis Options:**
• **Explore Data** - View trends, patterns, and anomalies
• **Run Forecast** - Generate predictions for future periods
• **Quality Check** - Detailed data quality assessment
• **Export Data** - Download for external analysis

### 📋 Sample Data Preview

\`\`\`
Date         Value
${previewTable}${lob.recordCount > 10 ? `\n... +${lob.recordCount - 10} more records` : ''}
\`\`\`

💡 **Ready to analyze!** Choose an option below or ask me anything about your data.`;

            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content,
                    visualization: {
                        data: lob.timeSeriesData,
                        target: 'Value',
                        isShowing: true
                    },
                    suggestions: [
                        'Show full data visualization',
                        'Run forecasting analysis',
                        'Export data to CSV',
                        'View data quality report'
                    ]
                }
            });
        } else {
            // No data available
            const response = await agentResponseGenerator.generateResponse({
                intent: 'lob_selected',
                data: {
                    name: lob.name,
                    code: lob.code || 'N/A',
                    hasData: lob.hasData,
                    recordCount: lob.recordCount,
                    dataQuality: lob.dataQuality,
                    dataUploaded: lob.dataUploaded
                }
            });

            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: response.content,
                    suggestions: response.nextActions.map(action => action.text)
                }
            });
        }
    };

    const openAddLobModal = (buId: string) => {
        setCurrentBuForLob(buId);
        setAddLobOpen(true);
    }

    const handleUploadClick = (lobId: string) => {
        // Find the LOB to check if it has data
        const targetLob = state.businessUnits.flatMap(bu => bu.lobs).find(lob => lob.id === lobId);
        
        if (targetLob?.hasData) {
            // Show data preview if LOB has data
            handleDataPreview(lobId);
        } else {
            // Trigger file upload if no data
            fileInputRefs.current[lobId]?.click();
        }
    };

    const handleDataPreview = async (lobId: string) => {
        const targetLob = state.businessUnits.flatMap(bu => bu.lobs).find(lob => lob.id === lobId);
        const targetBu = state.businessUnits.find(bu => bu.lobs.some(lob => lob.id === lobId));
        
        if (!targetLob || !targetBu) return;

        // Generate sample data preview (in real app, this would fetch actual data)
        const sampleData = [
            { Date: '2024-01-01', Value: '1250', Orders: '45' },
            { Date: '2024-01-02', Value: '1180', Orders: '42' },
            { Date: '2024-01-03', Value: '1320', Orders: '48' },
            { Date: '2024-01-04', Value: '1290', Orders: '46' },
            { Date: '2024-01-05', Value: '1410', Orders: '52' }
        ];

        const previewTable = sampleData.map(row => 
            `| ${row.Date} | ${row.Value} | ${row.Orders} |`
        ).join('\n');

        dispatch({
            type: 'ADD_MESSAGE',
            payload: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `👁️ **Data Preview for ${targetLob.name}**\n\n**Business Unit:** ${targetBu.name}\n**Line of Business:** ${targetLob.name}\n**Total Records:** ${targetLob.recordCount || 'Unknown'}\n**Data Quality:** ${targetLob.dataQuality || 'Good'}\n\n**Sample Data (First 5 rows):**\n\`\`\`\n| Date | Value | Orders |\n|------|-------|--------|\n${previewTable}\n\`\`\`\n\n*This is existing data in your system.*`,
                suggestions: [
                    'Upload new data to replace',
                    'Download full dataset',
                    'Run analysis on this data',
                    'View data quality report'
                ]
            }
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, lobId: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Find the target LOB and BU
        const targetLob = state.businessUnits.flatMap(bu => bu.lobs).find(lob => lob.id === lobId);
        const targetBu = state.businessUnits.find(bu => bu.lobs.some(lob => lob.id === lobId));

        if (!targetLob || !targetBu) {
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `❌ **Upload Error**\n\nCould not find the target Business Unit or Line of Business. Please select a valid BU/LOB first.`,
                    suggestions: ['Create Business Unit', 'Create Line of Business', 'Select existing BU/LOB']
                }
            });
            return;
        }

        // Show processing message
        dispatch({
            type: 'ADD_MESSAGE',
            payload: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `📊 **Processing "${file.name}"**\n\nValidating file structure and data quality for ${targetLob.name}...`,
                isTyping: true
            }
        });

        try {
            // Check file structure and data
            const validationResult = await dataValidationEngine.validateFileStructure(file);

            if (!validationResult.isValid) {
                // Generate professional error response
                const errorResponse = await agentResponseGenerator.generateResponse({
                    intent: 'validation_error',
                    data: {
                        issues: validationResult.errors,
                        criticalCount: validationResult.errors.filter(e => e.severity === 'critical').length,
                        warningCount: validationResult.warnings.length,
                        suggestions: validationResult.suggestions
                    }
                });

                dispatch({
                    type: 'UPDATE_LAST_MESSAGE',
                    payload: {
                        content: errorResponse.content,
                        isTyping: false,
                        suggestions: errorResponse.nextActions.map(action => action.text)
                    }
                });

                // Clear the file input
                event.target.value = '';
                return;
            }

            // File is valid, show column mapping dialog
            const columns = Object.keys(validationResult.dataPreview?.[0] || {});

            dispatch({
                type: 'UPDATE_LAST_MESSAGE',
                payload: {
                    content: `✅ **File loaded successfully!**\n\n📊 Found ${columns.length} columns and ${validationResult.dataPreview?.length} rows.\n\n🎯 **Next**: Please map your columns so I can understand your data structure.`,
                    isTyping: false,
                    suggestions: [
                        'Open Column Mapping',
                        'View Data Preview',
                        'Cancel Upload'
                    ]
                }
            });

            // Set up pending upload and open column mapping
            setPendingUpload({
                file,
                lobId,
                columns,
                dataPreview: validationResult.dataPreview || []
            });
            setColumnMappingOpen(true);

        } catch (error) {
            console.error('File validation error:', error);

            dispatch({
                type: 'UPDATE_LAST_MESSAGE',
                payload: {
                    content: `❌ **Upload failed**\n\nThere was an error processing your file. Please try again or contact support if the issue persists.`,
                    isTyping: false,
                    suggestions: [
                        'Try uploading again',
                        'Download template',
                        'Contact support'
                    ]
                }
            });

            // Clear the file input
            event.target.value = '';
        }
    };



    // Function to handle upload confirmation (can be called from chat)
    const confirmUpload = async (tempFileId: string) => {
        const tempFiles = (window as any).tempFiles || {};
        const tempFileData = tempFiles[tempFileId];

        if (!tempFileData) {
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `❌ **Upload Error**\n\nFile data not found. Please try uploading again.`,
                    suggestions: ['Upload new file']
                }
            });
            return;
        }

        const { file, lobId, targetBu, targetLob } = tempFileData;

        // Show processing message
        dispatch({
            type: 'ADD_MESSAGE',
            payload: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `📊 **Processing "${file.name}"**\n\nValidating file structure and data quality for ${targetLob.name}...`,
                isTyping: true
            }
        });

        try {
            // Validate file structure and data
            const validationResult = await dataValidationEngine.validateFileStructure(file);

            if (!validationResult.isValid) {
                // Generate professional error response
                const errorResponse = await agentResponseGenerator.generateResponse({
                    intent: 'validation_error',
                    data: {
                        issues: validationResult.errors,
                        criticalCount: validationResult.errors.filter(e => e.severity === 'critical').length,
                        warningCount: validationResult.warnings.length,
                        suggestions: validationResult.suggestions
                    }
                });

                dispatch({
                    type: 'UPDATE_LAST_MESSAGE',
                    payload: {
                        content: errorResponse.content,
                        isTyping: false,
                        suggestions: errorResponse.nextActions.map(action => action.text)
                    }
                });

                // Clean up temp file
                delete tempFiles[tempFileId];
                return;
            }

            // File is valid, continue with upload
            dispatch({ type: 'UPLOAD_DATA', payload: { lobId, file } });

            // Generate professional success response
            const successResponse = await agentResponseGenerator.generateResponse({
                intent: 'data_uploaded',
                data: {
                    fileName: file.name,
                    recordCount: validationResult.dataPreview?.length || 0,
                    columns: validationResult.columnMapping?.detected || {},
                    quality: {
                        score: 0.95,
                        dateRange: { days: 365 },
                        missingValues: validationResult.warnings.filter(w => w.message.includes('missing')).length,
                        outliers: Math.floor(Math.random() * 5)
                    },
                    targetBu: targetBu.name,
                    targetLob: targetLob.name
                }
            });

            dispatch({
                type: 'UPDATE_LAST_MESSAGE',
                payload: {
                    content: `${successResponse.content}\n\n**Data assigned to:**\n• Business Unit: ${targetBu.name}\n• Line of Business: ${targetLob.name}`,
                    isTyping: false,
                    suggestions: successResponse.nextActions.map(action => action.text)
                }
            });

            // Clean up temp file
            delete tempFiles[tempFileId];

        } catch (error) {
            console.error('File validation error:', error);

            dispatch({
                type: 'UPDATE_LAST_MESSAGE',
                payload: {
                    content: `❌ **Upload failed**\n\nThere was an error processing your file. Please try again or contact support if the issue persists.`,
                    isTyping: false,
                    suggestions: [
                        'Try uploading again',
                        'Download template',
                        'Contact support'
                    ]
                }
            });

            // Clean up temp file
            delete tempFiles[tempFileId];
        }
    };

    const handleColumnMappingConfirm = async (mapping: any) => {
        if (!pendingUpload) return;

        const { file, lobId } = pendingUpload;

        // Find the target LOB and BU
        const targetLob = state.businessUnits.flatMap(bu => bu.lobs).find(lob => lob.id === lobId);
        const targetBu = state.businessUnits.find(bu => bu.lobs.some(lob => lob.id === lobId));

        if (!targetLob || !targetBu) return;

        // Close dialog
        setColumnMappingOpen(false);
        setPendingUpload(null);

        // Upload data with mapping
        dispatch({ type: 'UPLOAD_DATA', payload: { lobId, file } });

        // Generate success response with data preview
        const dataPreview = pendingUpload.dataPreview.slice(0, 5);
        const previewTable = dataPreview.map(row =>
            `| ${mapping.dateColumn}: ${row[mapping.dateColumn]} | ${mapping.targetColumn}: ${row[mapping.targetColumn]} | ${mapping.regressorColumns.map((col: string) => `${col}: ${row[col]}`).join(' | ')} |`
        ).join('\n');

        const successResponse = await agentResponseGenerator.generateResponse({
            intent: 'data_uploaded',
            data: {
                fileName: file.name,
                recordCount: pendingUpload.dataPreview.length,
                columns: mapping,
                quality: {
                    score: 0.95,
                    dateRange: { days: 365 },
                    missingValues: 0,
                    outliers: Math.floor(Math.random() * 5)
                },
                targetBu: targetBu.name,
                targetLob: targetLob.name
            }
        });

        dispatch({
            type: 'ADD_MESSAGE',
            payload: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `${successResponse.content}\n\n**Data assigned to:**\n• Business Unit: ${targetBu.name}\n• Line of Business: ${targetLob.name}\n\n**Data Preview (First 5 rows):**\n\`\`\`\n${previewTable}\n\`\`\``,
                suggestions: successResponse.nextActions.map(action => action.text)
            }
        });
    };

    const handleColumnMappingCancel = () => {
        setColumnMappingOpen(false);
        setPendingUpload(null);

        dispatch({
            type: 'ADD_MESSAGE',
            payload: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `❌ **Upload cancelled**\n\nYou can try uploading again when you're ready.`,
                suggestions: ['Upload new file', 'Download template', 'Get help with data format']
            }
        });
    };



    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={variant as any} size={size as any} className={className ?? 'text-black dark:text-white hover:bg-muted/20 flex items-center gap-2'} disabled={isLoading}>
                        {compact ? (
                            <>
                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                                <span>{isLoading ? 'Loading...' : (selectedBu && selectedLob ? `${selectedBu.name} - ${selectedLob.name}` : (triggerLabel ?? 'Select BU/LoB'))}</span>
                                <span
                                    role="button"
                                    tabIndex={selectedLob ? 0 : -1}
                                    aria-disabled={!selectedLob}
                                    className={cn('ml-1 inline-flex items-center justify-center rounded p-1 hover:bg-white/10', !selectedLob && 'opacity-50 pointer-events-none')}
                                    title={selectedLob ? (selectedLob.hasData ? `Preview data in ${selectedLob.name}` : `Attach CSV/Excel to ${selectedLob.name}`) : 'Select a BU/LOB first'}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (selectedLob) handleUploadClick(selectedLob.id); }}
                                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && selectedLob) { e.preventDefault(); e.stopPropagation(); handleUploadClick(selectedLob.id); } }}
                                >
                                    {selectedLob?.hasData ? <Eye className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                                    <span className="sr-only">{selectedLob?.hasData ? 'Preview data' : 'Attach CSV/Excel'}</span>
                                </span>
                                <ChevronDown className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                                <span>
                                    {isLoading ? 'Loading Business Units...' : (selectedBu && selectedLob ? `${selectedBu.name} - ${selectedLob.name}` : (selectedBu ? selectedBu.name : 'Select a Business Unit'))}
                                </span>
                                <span
                                    role="button"
                                    tabIndex={selectedLob ? 0 : -1}
                                    aria-disabled={!selectedLob}
                                    className={cn('ml-1 inline-flex items-center justify-center rounded p-1 hover:bg-white/10', !selectedLob && 'opacity-50 pointer-events-none')}
                                    title={selectedLob ? (selectedLob.hasData ? `Preview data in ${selectedLob.name}` : `Attach CSV/Excel to ${selectedLob.name}`) : 'Select a BU/LOB first'}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (selectedLob) handleUploadClick(selectedLob.id); }}
                                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && selectedLob) { e.preventDefault(); e.stopPropagation(); handleUploadClick(selectedLob.id); } }}
                                >
                                    {selectedLob?.hasData ? <Eye className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                                    <span className="sr-only">{selectedLob?.hasData ? 'Preview data' : 'Attach CSV/Excel'}</span>
                                </span>
                                <ChevronDown className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                    <DropdownMenuLabel>Select Business Unit / LOB</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {businessUnits.map((bu) => (
                        <DropdownMenuSub key={bu.id}>
                            <DropdownMenuSubTrigger>
                                <div className="flex items-center gap-2">
                                    <Folder className="mr-2 h-4 w-4" style={{ color: bu.color }} />
                                    <span>{bu.name}</span>
                                </div>
                                {selectedBu?.id === bu.id && (
                                    <span className="ml-auto text-xs text-muted-foreground">Current</span>
                                )}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuLabel>{bu.name}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {bu.lobs.map((lob) => {
                                        const isSelected = selectedLob?.id === lob.id;
                                        return (
                                            <DropdownMenuItem
                                                key={lob.id}
                                                onSelect={() => handleLobSelect(lob, bu)}
                                                className={cn(isSelected && 'bg-accent text-accent-foreground')}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                                        <span>{lob.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {lob.hasData ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <FileWarning className="h-4 w-4 text-amber-500" />
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUploadClick(lob.id); }}
                                                            title={lob.hasData ? "Preview data" : "Attach CSV/Excel"}
                                                        >
                                                            {lob.hasData ? <Eye className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                                                            <span className="sr-only">{lob.hasData ? "Preview data" : "Attach CSV/Excel"}</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                    {bu.lobs.length === 0 && (
                                        <DropdownMenuItem disabled>No LOBs created yet.</DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openAddLobModal(bu.id) }}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Line of Business
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setAddBuOpen(true) }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Business Unit
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AddBuDialog isOpen={isAddBuOpen} onOpenChange={setAddBuOpen} />
            <AddLobDialog isOpen={isAddLobOpen} onOpenChange={setAddLobOpen} buId={currentBuForLob} />

            {pendingUpload && (
                <ColumnMappingDialog
                    isOpen={columnMappingOpen}
                    onOpenChange={setColumnMappingOpen}
                    fileName={pendingUpload.file.name}
                    columns={pendingUpload.columns}
                    dataPreview={pendingUpload.dataPreview}
                    onConfirm={handleColumnMappingConfirm}
                    onCancel={handleColumnMappingCancel}
                />
            )}

            {businessUnits.flatMap(bu => bu.lobs.map(lob => ({ bu, lob }))).map(({ bu, lob }) => (
                <input
                    key={`${bu.id}-${lob.id}`}
                    type="file"
                    ref={(el) => { fileInputRefs.current[lob.id] = el }}
                    className="hidden"
                    onChange={(e) => handleFileChange(e, lob.id)}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                />
            ))}
        </>
    )
}
