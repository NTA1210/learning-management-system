import { useInfiniteQuery } from "@tanstack/react-query";

import { useCallback, type RefObject } from "react";
import { messageService } from "../services/messageService";

export function useMessages(
  conversationId: string | undefined,
  containerRef: RefObject<HTMLDivElement | null>
) {
  const query = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      if (!conversationId) throw new Error("conversationId is null");
      return messageService.fetchMessages(conversationId, pageParam);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.nextCursor : undefined;
    },
    enabled: !!conversationId,
    staleTime: Infinity,
    refetchOnMount: true,
  });

  const handleLoadMore = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;

    const container = containerRef.current;
    if (!container) return;

    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;

    try {
      await query.fetchNextPage();

      setTimeout(() => {
        if (container) {
          const scrollHeightAfter = container.scrollHeight;
          container.scrollTop =
            scrollTopBefore + scrollHeightAfter - scrollHeightBefore;
        }
      }, 0);
    } catch (error) {
      console.error("Error loading more messages:", error);
    }
  }, [containerRef, query]);

  return {
    ...query,
    handleLoadMore,
  };
}
