import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Search, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Tag as TagType } from "@/lib/types";

export default function Tags() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tags, isLoading } = useQuery<TagType[]>({
    queryKey: ['/api/tags'],
  });

  const filteredTags = tags?.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Tag className="h-8 w-8 text-primary" />
            Tags
          </h1>
          <p className="text-muted-foreground">
            A tag is a keyword or label that categorizes your question with other, similar questions.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by tag name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-tag-search"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        ) : filteredTags && filteredTags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.name}`}>
                <Card className="p-4 h-full hover-elevate cursor-pointer transition-all" data-testid={`card-tag-${tag.name}`}>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-sm">
                      {tag.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {tag.questionCount}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {tag.description || `Questions tagged with ${tag.name}`}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tags found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Tags will appear as questions are asked"}
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
