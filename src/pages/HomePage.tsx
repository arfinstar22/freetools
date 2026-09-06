import React, { useState, useEffect } from 'react';
import { HeroMauNgapain } from '../components/home/HeroMauNgapain';
import { FileFirstAssistant } from '../components/home/FileFirstAssistant';
import { AIRecommendationCard } from '../components/home/AIRecommendationCard';
import { PopularTools } from '../components/home/PopularTools';
import { ValueProps } from '../components/home/ValueProps';
import { interpretUserIntent } from '../ai/provider';
import { analyzeFileGroup, revokeFileGroupPreviews } from '../engine/file-detector';
import { IntentResult } from '../types/ai';
import { FileGroupAnalysis } from '../types/file';
import { WorkflowPlan } from '../types/workflow';

interface HomePageProps {
  onSelectTool: (toolId: string, files?: File[]) => void;
  setActiveView: (view: string) => void;
  privateMode: boolean;
  onLaunchWorkflow: (workflow: WorkflowPlan, files?: File[]) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTool,
  setActiveView,
  privateMode,
  onLaunchWorkflow
}) => {
  const [intent, setIntent] = useState<IntentResult | null>(null);
  const [analysis, setAnalysis] = useState<FileGroupAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clean up object URLs when analysis changes or unmounts
  useEffect(() => {
    return () => {
      if (analysis) {
        revokeFileGroupPreviews(analysis);
      }
    };
  }, [analysis]);

  const handleSearchIntent = async (query: string) => {
    setIsLoading(true);
    if (analysis) {
      revokeFileGroupPreviews(analysis);
      setAnalysis(null);
    }
    const result = await interpretUserIntent(query, { privateMode });
    setIntent(result);
    setIsLoading(false);
  };

  const handleFilesDropped = (files: File[]) => {
    setIntent(null);
    if (analysis) {
      revokeFileGroupPreviews(analysis);
    }
    const result = analyzeFileGroup(files);
    setAnalysis(result);
  };

  const handleClearFiles = () => {
    if (analysis) {
      revokeFileGroupPreviews(analysis);
      setAnalysis(null);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    if (!analysis) return;
    const removedItem = analysis.files.find((f) => f.id === fileId);
    if (removedItem?.previewUrl) {
      try {
        URL.revokeObjectURL(removedItem.previewUrl);
      } catch {
        // Safe
      }
    }

    const remaining = analysis.files.filter((f) => f.id !== fileId);
    if (remaining.length === 0) {
      setAnalysis(null);
    } else {
      setAnalysis(analyzeFileGroup(remaining.map((r) => r.file)));
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <HeroMauNgapain
        onSearchIntent={handleSearchIntent}
        onFilesDropped={handleFilesDropped}
        isSearching={isLoading}
      />

      <div className="px-4 pb-12 w-full max-w-6xl mx-auto space-y-8">
        {/* Assistant Area */}
        {analysis && (
          <FileFirstAssistant
            analysis={analysis}
            onSelectAction={(toolId, files) => {
              onSelectTool(toolId, files);
            }}
            onClearFiles={handleClearFiles}
            onRemoveFile={handleRemoveFile}
          />
        )}

        {intent && !analysis && (
          <AIRecommendationCard
            intent={intent}
            onLaunchTool={(toolId) => onSelectTool(toolId)}
            onLaunchWorkflow={(wf) => onLaunchWorkflow(wf)}
            onSelectCategory={() => {
              setActiveView('tools');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>

      <PopularTools
        onSelectTool={(id) => onSelectTool(id)}
        onViewAll={() => setActiveView('tools')}
      />
      <ValueProps />
    </div>
  );
};
