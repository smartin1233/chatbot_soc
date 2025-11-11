// src/components/layout/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History, Menu, X } from "lucide-react";
import {
Sheet,
SheetContent,
SheetDescription,
SheetHeader,
SheetTitle,
SheetTrigger,
} from "@/components/ui/sheet";
import { ChatHistory } from "./ChatHistory";

export function Header() {
const [isMenuOpen, setIsMenuOpen] = useState(false);

return (
<header className="bg-background border-b sticky top-0 z-50">
<div className="container mx-auto px-4 flex justify-between items-center h-16">
<Link href="/" className="text-2xl font-bold text-primary">
AI Agent Marketplace
</Link>
<nav className="hidden md:flex items-center space-x-6">
<Link href="/ai-market" className="hover:text-primary">
Marketplace
</Link>
<Link href="/chat" className="hover:text-primary">
Chat
</Link>
<Link href="/docs" className="hover:text-primary">
Documentation
</Link>
<Sheet>
<SheetTrigger asChild>
<Button variant="ghost" size="icon">
<History className="h-5 w-5" />
</Button>
</SheetTrigger>
<SheetContent>
<SheetHeader>
<SheetTitle>Chat History</SheetTitle>
<SheetDescription>
View and resume your previous conversations
</SheetDescription>
</SheetHeader>
<ChatHistory />
</SheetContent>
</Sheet>
</nav>
<div className="md:hidden">
<button onClick={() => setIsMenuOpen(!isMenuOpen)}>
{isMenuOpen ? <X /> : <Menu />}
</button>
</div>
</div>
{isMenuOpen && (
<div className="md:hidden bg-background border-t">
<div className="container mx-auto px-4 py-4 space-y-2">
<Link
href="/ai-market"
className="block py-2 hover:text-primary"
onClick={() => setIsMenuOpen(false)}
>
Marketplace
</Link>
<Link
href="/chat"
className="block py-2 hover:text-primary"
onClick={() => setIsMenuOpen(false)}
>
Chat
</Link>
<Link
href="/docs"
className="block py-2 hover:text-primary"
onClick={() => setIsMenuOpen(false)}
>
Documentation
</Link>
</div>
</div>
)}
</header>
);
}
