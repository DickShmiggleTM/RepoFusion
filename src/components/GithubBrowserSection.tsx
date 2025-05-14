
"use client";

import { Github, Download, Copy, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Window } from '@/components/Window';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
}

function RepoCardSkeleton() {
  return (
    <Card className="bg-card/50 border-primary/30">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <div className="flex space-x-4 mt-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter className="flex space-x-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </CardFooter>
    </Card>
  );
}

export function GithubBrowserSection() {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoData, setRepoData] = useState<GitHubRepo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRepoData = async (currentUrl: string) => {
    if (!currentUrl) {
      setError("Please enter a repository URL.");
      setRepoData(null);
      return;
    }

    const match = currentUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      setError("Invalid GitHub repository URL. Use format: https://github.com/owner/repo");
      setRepoData(null);
      return;
    }
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    setIsLoading(true);
    setError(null);
    setRepoData(null); 

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Repository not found: ${owner}/${repo}`);
        } else if (response.status === 403) {
           throw new Error(`API rate limit exceeded. Please check your connection or try again later.`);
        }
        throw new Error(`Failed to fetch repository data (Status: ${response.status})`);
      }
      const data: GitHubRepo = await response.json();
      setRepoData(data);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      if (!errorMessage.includes("not found") && !errorMessage.includes("rate limit")) {
        toast({ title: "Error Fetching Repository", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!repoUrl) {
      setRepoData(null);
      setError(null);
      setIsLoading(false); 
      return;
    }
    const handler = setTimeout(() => {
      fetchRepoData(repoUrl);
    }, 1000); 

    return () => {
      clearTimeout(handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]); 

  const handleLoadButtonClick = () => {
    if (repoUrl) {
      fetchRepoData(repoUrl);
    }
  };

  const handleClone = () => {
    if (repoData) {
      navigator.clipboard.writeText(`git clone ${repoData.html_url}.git`);
      toast({ title: "Clone URL Copied!", description: `git clone ${repoData.html_url}.git` });
    }
  };

  const handleDownload = () => {
    if (repoData) {
      const downloadUrl = `${repoData.html_url}/archive/refs/heads/${repoData.default_branch || 'main'}.zip`;
      window.open(downloadUrl, '_blank');
      toast({ title: "Download Started", description: `Downloading ${repoData.name}.zip` });
    }
  };

  return (
    <Window title="GitHub Repository Browser" icon={<Github size={18} />} className="min-h-[400px]">
      <div className="space-y-4">
        <div>
          <Label htmlFor="repoUrlInput" className="text-primary">GitHub Repository URL</Label>
          <div className="flex space-x-2">
            <Input
              id="repoUrlInput"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="e.g., https://github.com/vercel/next.js"
              className="bg-input border-primary/50 focus:border-primary"
              aria-describedby="repo-error"
              aria-invalid={!!error}
            />
            <Button onClick={handleLoadButtonClick} disabled={isLoading || !repoUrl} className="bg-primary text-primary-foreground hover:bg-primary/80">
              {isLoading ? "Loading..." : "Load Repo"}
            </Button>
          </div>
          {error && <p id="repo-error" className="text-destructive text-xs mt-1 flex items-center"><AlertTriangle size={14} className="mr-1 inline-block" /> {error}</p>}
        </div>

        {isLoading && <RepoCardSkeleton />}

        {!isLoading && repoData && (
          <Card className={cn(
            "bg-card/50 border-primary/30 animate-fade-in-up",
            "hover:border-primary/70 hover:shadow-md transition-all duration-200"
            )}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Image 
                  src={repoData.owner.avatar_url} 
                  alt={`${repoData.owner.login} avatar`} 
                  width={40} 
                  height={40} 
                  className="rounded-full border border-primary"
                  data-ai-hint="avatar profile"
                />
                <div>
                  <CardTitle className="text-primary">{repoData.name}</CardTitle>
                  <CardDescription>
                    <a href={repoData.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground/80">
                      {repoData.full_name}
                    </a>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{repoData.description || "No description provided."}</p>
              <div className="text-xs text-muted-foreground flex items-center space-x-4 flex-wrap gap-y-1">
                <span>⭐ {repoData.stargazers_count.toLocaleString()}</span>
                <span>🍴 {repoData.forks_count.toLocaleString()}</span>
                <span>⚠️ {repoData.open_issues_count.toLocaleString()} open issues</span>
              </div>
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button variant="outline" onClick={handleClone} className="border-primary text-primary hover:bg-primary/10">
                <Copy size={16} className="mr-2" /> Clone URL
              </Button>
              <Button variant="outline" onClick={handleDownload} className="border-primary text-primary hover:bg-primary/10">
                <Download size={16} className="mr-2" /> Download .zip
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {!isLoading && !repoData && !error && !repoUrl && (
           <div className="text-center text-muted-foreground pt-8 animate-fade-in">
            <Github size={32} className="mx-auto mb-2 opacity-50" />
            <p>Enter a GitHub repository URL above to view its details.</p>
          </div>
        )}
      </div>
    </Window>
  );
}
