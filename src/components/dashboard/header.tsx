'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, User, Bot, BarChart, FileText, Printer, UploadCloud, Key, TrendingUp, LogOut, Palette } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import placeholderImages from '@/lib/placeholder-images.json';
import { useApp } from './app-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EnhancedAgentMonitor from './enhanced-agent-monitor';
import ReportViewer from './report-viewer';
import BuLobSelector from './bu-lob-selector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import APISettingsDialog from './api-settings-dialog';




const SettingsDropdown = ({ onGenerateReport, isReportGenerating }: { onGenerateReport: () => void, isReportGenerating: boolean }) => {
    const { state, dispatch } = useApp();
    const [showAPISettings, setShowAPISettings] = useState(false);

    const showAgentMonitor = () => {
        dispatch({ type: 'SET_AGENT_MONITOR_OPEN', payload: true });
    };

    const handlePrint = () => {
        window.print();
    };

    // API key management handled in APISettingsDialog

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                        <Settings className="w-5 h-5" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                    <DropdownMenuLabel>System Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setShowAPISettings(true)}>
                        <Key className="mr-2 h-4 w-4" />
                        <span>API Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={showAgentMonitor}>
                        <BarChart className="mr-2 h-4 w-4" />
                        <span>Show Agent Monitor Panel</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onGenerateReport} disabled={isReportGenerating}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>{isReportGenerating ? 'Generating Report...' : 'Generate Report'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        <span>Print/Export Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        <p>OpenAI Status: <span className="text-green-600">Connected</span></p>
                        <p>Model: GPT-4</p>
                        <p>Requests Today: 47/1000</p>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
            <APISettingsDialog open={showAPISettings} onOpenChange={setShowAPISettings} />
            <Dialog open={state.agentMonitor.isOpen} onOpenChange={(isOpen) => dispatch({ type: 'SET_AGENT_MONITOR_OPEN', payload: isOpen })}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Agent Activity Monitor</DialogTitle>
                    </DialogHeader>
                    <EnhancedAgentMonitor className="flex-1 min-h-0" />
                </DialogContent>
            </Dialog>
        </>
    );
};

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
    const userAvatar = placeholderImages.placeholderImages.find(p => p.id === 'user-avatar');
    const { state, dispatch } = useApp();
    const [isReportGenerating, setIsReportGenerating] = useState(false);
    const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
    const [isReportViewerOpen, setIsReportViewerOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


    const showAgentMonitor = () => {
        dispatch({ type: 'SET_AGENT_MONITOR_OPEN', payload: true });
    };

    const handleGenerateReport = async () => {
        setIsReportGenerating(true);
        try {
            const { selectedBu, selectedLob, messages } = state;
            const context = `
            Business Unit: ${selectedBu?.name}
            Line of Business: ${selectedLob?.name}
            Data Summary: ${selectedLob?.recordCount} records, completeness ${selectedLob?.dataQuality?.completeness}%, ${selectedLob?.dataQuality?.outliers} outliers.
        `;
            const history = JSON.stringify(messages.map(m => ({ role: m.role, content: m.content })));

            const res = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationHistory: history, analysisContext: context })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const result = await res.json();
            setReportMarkdown(result.reportMarkdown);
            setIsReportViewerOpen(true);
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setIsReportGenerating(false);
        }
    };


    return (
        <header className="h-16 bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground flex items-center justify-between px-6 shrink-0 print:hidden shadow-lg backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold">Assistant </h1>
                {!state.isOnboarding && (
                    <>
                        <span className="text-sm opacity-80 hidden md:inline">|</span>
                        <BuLobSelector />
                    </>
                )}
            </div>

            <div className="flex items-center space-x-4">
                {/* Add a simple button to toggle light/dark theme */}
                <button
                  onClick={() => {
                    const html = document.documentElement;
                    if (html.classList.contains('dark')) {
                      html.classList.remove('dark');
                      html.setAttribute('data-theme', 'light');
                      localStorage.setItem('themeMode', 'light');
                    } else {
                      html.classList.add('dark');
                      html.setAttribute('data-theme', 'dark');
                      localStorage.setItem('themeMode', 'dark');
                    }
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                  title="Toggle Light/Dark Theme"
                >
                  <Palette className="w-5 h-5" />
                </button>
                <button
                    onClick={showAgentMonitor}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                    title="Show Agent Monitor"
                >
                    <Bot className="w-5 h-5" />
                </button>


                <button
                    onClick={() => {
                        // If no LOB selected, do nothing
                        if (!state.selectedLob) return;
                        const input = document.getElementById('header-upload-input') as HTMLInputElement | null;
                        input?.click();
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50"
                    title={state.selectedLob ? `Attach CSV/Excel to ${state.selectedLob.name}` : 'Select a BU/LOB first'}
                    disabled={!state.selectedLob}
                >
                    <UploadCloud className="w-5 h-5" />
                </button>
                <input
                    id="header-upload-input"
                    type="file"
                    className="hidden"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && state.selectedLob) {
                            dispatch({ type: 'UPLOAD_DATA', payload: { lobId: state.selectedLob.id, file } });
                            // reset value so the same file can be selected twice if needed
                            e.currentTarget.value = '';
                        }
                    }}
                />

                <SettingsDropdown onGenerateReport={handleGenerateReport} isReportGenerating={isReportGenerating} />

                <div className="w-3 h-3 bg-green-400 rounded-full" title="System Online"></div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                            <Avatar className="h-10 w-10">
                                {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" data-ai-hint={userAvatar.imageHint} />}
                                <AvatarFallback>
                                    <User />
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {typeof window !== 'undefined' && localStorage.getItem('zentere_username')?.split('@')[0]?.split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ') || 'User'}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {typeof window !== 'undefined' && localStorage.getItem('zentere_username') || 'user@example.com'}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onSelect={() => setShowLogoutConfirm(true)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {reportMarkdown && (
                <ReportViewer
                    isOpen={isReportViewerOpen}
                    onOpenChange={setIsReportViewerOpen}
                    markdownContent={reportMarkdown}
                    isRealData={false} // TODO: Set to true only if report is from validated backend workflow
                />
            )}

            {/* Logout Confirmation Dialog */}
            <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LogOut className="h-5 w-5 text-red-500" />
                            Confirm Logout
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground">
                            Are you sure you want to log out? You'll need to sign in again to access the dashboard.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowLogoutConfirm(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={() => {
                                setShowLogoutConfirm(false);
                                if (onLogout) {
                                    setTimeout(() => {
                                        onLogout();
                                    }, 200);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Log out
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </header>
    );
}
