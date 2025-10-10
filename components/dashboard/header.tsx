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
import { Settings, User, Bot, BarChart, Sun, Moon, FileText, Printer, UploadCloud, Key } from 'lucide-react';
import placeholderImages from '@/lib/placeholder-images.json';
import { useApp } from "@/components/dashboard/app-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EnhancedAgentMonitor from './enhanced-agent-monitor';
import ReportViewer from './report-viewer';
import BuLobSelector from './bu-lob-selector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ThemeToggle = () => {
    const [theme, setTheme] = React.useState('light');

    React.useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');
    }, []);

    const toggleTheme = () => {
        if (theme === 'light') {
            document.documentElement.classList.add('dark');
            setTheme('dark');
        } else {
            document.documentElement.classList.remove('dark');
            setTheme('light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
            title="Toggle Theme"
        >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
    );
};


const SettingsDropdown = ({ onGenerateReport, isReportGenerating }: { onGenerateReport: () => void, isReportGenerating: boolean }) => {
    const { state, dispatch } = useApp();
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');

    const showAgentMonitor = () => {
        dispatch({ type: 'SET_AGENT_MONITOR_OPEN', payload: true });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSaveApiKey = async () => {
        try {
            const response = await fetch('/api/save-api-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ apiKey }),
            });

            if (response.ok) {
                console.log('API Key saved successfully');
                // You might want to show a toast notification here
            } else {
                console.error('Failed to save API key');
                // You might want to show an error message here
            }
        } catch (error) {
            console.error('Error saving API key:', error);
        } finally {
            setIsSettingsDialogOpen(false);
        }
    };

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
                    <DropdownMenuItem onSelect={() => setIsSettingsDialogOpen(true)}>
                        <Key className="mr-2 h-4 w-4" />
                        <span>Edit API Key</span>
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
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit API Key</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="api-key" className="text-right">
                                API Key
                            </Label>
                            <Input
                                id="api-key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="col-span-3"
                                placeholder="Enter your OpenAI API Key"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSaveApiKey}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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

export default function Header() {
  const userAvatar = placeholderImages.placeholderImages.find(p => p.id === 'user-avatar');
  const { state, dispatch } = useApp();
  const [isReportGenerating, setIsReportGenerating] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [isReportViewerOpen, setIsReportViewerOpen] = useState(false);

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
    <header className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between px-6 shrink-0 print:hidden">
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
             <ThemeToggle />
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
                    <p className="text-sm font-medium leading-none">BI Analyst</p>
                    <p className="text-xs leading-none text-muted-foreground">
                    analyst@example.com
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
                  onSelect={() => {
                    localStorage.removeItem("isAuthenticated");
                    dispatch({ type: "SET_AUTH", payload: false });
                    window.location.href = "/login";
                  }}
                >
                  Log out
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
    </header>
  );
}
