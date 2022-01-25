// @flow
import * as React from 'react';
import { type ChosenCategory } from './FiltersChooser';
import shuffle from 'lodash/shuffle';
import Fuse from 'fuse.js';

/**
 * Filter a list of items according to the chosen category
 * and the chosen filters.
 */
export const filterSearchItems = <SearchItem: { tags: Array<string> }>(
  searchItems: ?Array<SearchItem>,
  chosenCategory: ?ChosenCategory,
  chosenFilters: Set<string>
): ?Array<SearchItem> => {
  if (!searchItems) return null;

  const startTime = performance.now();
  const filteredSearchItems = searchItems
    .filter(({ tags }) => {
      if (!chosenCategory) return true;

      const hasChosenCategoryTag =
        // If the chosen category is a container of tags, not a real tag, then
        // skip checking if the item has it.
        chosenCategory.node.isTagContainerOnly ||
        tags.some(tag => tag === chosenCategory.node.name);
      if (!hasChosenCategoryTag) return false; // Asset is not in the selected category
      for (const parentNode of chosenCategory.parentNodes) {
        if (parentNode.isTagContainerOnly) {
          // The parent is a container of tags, not a real tag. No need
          // to check if the item has it.
          return true;
        }

        const hasParentCategoryTag = tags.some(tag => tag === parentNode.name);
        if (!hasParentCategoryTag) return false; // Asset is not in the parent(s) of the selected category
      }

      return true;
    })
    .filter(({ tags }) => {
      return (
        chosenFilters.size === 0 || tags.some(tag => chosenFilters.has(tag))
      );
    });

  const totalTime = performance.now() - startTime;
  console.info(
    `Filtered items by category/filters in ${totalTime.toFixed(3)}ms.`
  );
  return filteredSearchItems;
};

/**
 * Allow to efficiently search and filters items.
 *
 * This instanciates a search API, indexes the specified items,
 * then returns the results of the search (according to the
 * search text and the chosen category/filters).
 */
export const useSearchItem = <SearchItem: { tags: Array<string> }>(
  searchItemsById: ?{ [string]: SearchItem },
  searchText: string,
  chosenCategory: ?ChosenCategory,
  chosenFilters: Set<string>
): ?Array<SearchItem> => {
  const searchApiRef = React.useRef<?any>(null);
  const [searchResults, setSearchResults] = React.useState<?Array<SearchItem>>(
    null
  );

  // Keep in memory a list of all the items, shuffled for
  // easing random discovery of items when no search is done.
  const shuffledSearchItems: ?Array<SearchItem> = React.useMemo(
    () => {
      if (!searchItemsById) return null;

      return shuffle(
        Object.keys(searchItemsById).map(id => searchItemsById[id])
      );
    },
    [searchItemsById]
  );

  // Index items that have been loaded.
  React.useEffect(
    () => {
      if (!searchItemsById) {
        // Nothing to index - yet.
        return;
      }

      const startTime = performance.now();
      if (searchApiRef.current) {
        searchApiRef.current = null;
      }

      try {
        const newSearchApi = new Fuse(Object.values(searchItemsById), {
          keys: [
            { name: 'name', weight: 2 },
            { name: 'shortDescription', weight: 1 },
          ],
          minMatchCharLength: 3,
          threshold: 0.35,
          includeMatches: true,
          ignoreLocation: true,
          ignoreFieldNorm: true,
        });

        const totalTime = performance.now() - startTime;
        console.info(
          `Indexed ${
            Object.keys(searchItemsById).length
          } items in ${totalTime.toFixed(3)}ms.`
        );
        searchApiRef.current = newSearchApi;
      } catch (error) {
        console.error('Error while indexing items: ', error);
      }
    },
    [searchItemsById]
  );

  // Update the search results according to the items, search term
  // chosen category and chosen filters.
  const searchApi = searchApiRef.current;
  React.useEffect(
    () => {
      let discardSearch = false;
      if (!searchText) {
        setSearchResults(
          filterSearchItems(shuffledSearchItems, chosenCategory, chosenFilters)
        );
      } else {
        if (!searchItemsById || !searchApi) {
          console.info(
            'Search for items skipped because items are not ready - will be retried when ready'
          );
          return;
        }

        const startTime = performance.now();
        const results = searchApi.search(`'${searchText}`);
        const totalTime = performance.now() - startTime;
        console.info(
          `Found ${results.length} items in ${totalTime.toFixed(3)}ms.`
        );
        if (discardSearch) {
          console.info(
            'Discarding search results as a new search was launched.'
          );
          return;
        }
        setSearchResults(
          filterSearchItems(
            results
              // .filter(result => result.score <= 0.3)
              .map(result => ({
                ...result.item,
                matches: result.matches,
              })),
            chosenCategory,
            chosenFilters
          )
        );
      }

      return () => {
        // Effect is being destroyed - meaning that a new search was launched.
        // Cancel this one.
        discardSearch = true;
      };
    },
    [
      shuffledSearchItems,
      searchItemsById,
      searchText,
      chosenCategory,
      chosenFilters,
      searchApi,
    ]
  );

  return searchResults;
};
