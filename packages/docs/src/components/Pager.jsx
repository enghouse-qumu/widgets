import React from 'react';

export const Pager = ({
  nextLink,
  prevLink,
  nextLinkText,
  prevLinkText
}) => {
  const findAdjacentSibling = function (elem, selector, direction) {
    // Get the next sibling element
    let sibling = elem[direction === 'prev' ? 'previousElementSibling' : 'nextElementSibling'];

    if (!selector) {
      return sibling;
    }

    while (sibling) {
      if (sibling.matches(selector)) {
        return sibling;
      }
      sibling = sibling[direction === 'prev' ? 'previousElementSibling' : 'nextElementSibling'];
    }
  };

  const getAdjacentPageInSidebar = (direction) => {
    // From parent iframe
    const sidebar = window.parent.document.querySelector('#storybook-explorer-tree');
    if (!sidebar) return null;
    const sidebarActiveItem = sidebar.querySelector('[data-selected="true"]');
    if (!sidebarActiveItem) return null;
    const sidebarAdjacentToActiveItem = findAdjacentSibling(sidebarActiveItem, '.sidebar-item', direction);
    if (!sidebarAdjacentToActiveItem) return null;
    const sidebarAdjacentToActiveItemLink = sidebarAdjacentToActiveItem.querySelector('a');
    if (!sidebarAdjacentToActiveItemLink) return null;
    console.log(sidebarAdjacentToActiveItemLink.getAttribute('href'));
    return sidebarAdjacentToActiveItemLink;
  };

  const prevDocLink = getAdjacentPageInSidebar('prev');
  const nextDocLink = getAdjacentPageInSidebar('next');
  const prevDocLinkText = prevDocLink?.textContent;
  const nextDocLinkText = nextDocLink?.textContent;
  const prevDocLinkHref = prevDocLink?.getAttribute('href');
  const nextDocLinkHref = nextDocLink?.getAttribute('href');

  return (
    <div className="pager">
      {(prevLink || prevDocLinkHref) && (
        <a href={prevLink ?? prevDocLinkHref} className="pager_link pager_link--prev">
            {prevLinkText || prevDocLinkText}
        </a>
      )}

      {(nextLink || nextDocLinkHref) && (
        <a href={nextLink ?? nextDocLinkHref} className="pager_link pager_link--next">
          {nextLinkText || nextDocLinkText}
        </a>
      )}
    </div>
  );
};
