# Use cursor pagination for explorer lists

Use cursor pagination for the block, blob, and transaction lists, including the address page transaction list. The server returns a versioned, URL-safe cursor token that the client sends unchanged in later requests. Keep the token structure internal to the server so clients do not depend on the fields that define a position.

Use First, Previous, and Next controls. Remove page-number entry and the Last control because direct page jumps do not follow from a cursor position.

Add `/v1/blocks`, `/v1/blobs`, and `/v1/transactions` for cursor pagination. These routes reject the `p` request parameter with a clear error. Keep the existing unversioned routes and tRPC `getAll` procedures unchanged, including their page-number pagination, defaults, validation, response fields, filters, and sort order. Add separate tRPC `getAllByCursor` procedures for the web interface. Keep `ps` for page size and keep total counts optional through `count`. The web interface uses cursor information to control navigation. It loads the total count with a separate query for the active filters. The item count and total pages stay visible while another cursor page loads.

Return a `pagination` object with `nextCursor` and `previousCursor`. Each token includes its direction, so both use the same `cursor` request parameter. Use `null` when no page exists in a direction.

For the v1 routes, keep the default page size at 50. Accept only integer values from 1 to 100 for `ps`. Reject values outside this range.

Do not include a query hash in the cursor. Clients must start with the first page when the resource, filters, or sort order change. The web interface clears the cursor when filters, sort order, or page size change. The server still checks the token structure and position values.

Store `cursor`, `ps`, and the display-only `page` number in the web page URL. Never send `page` to the list API. Show the current page and total pages without page-number entry. The page number counts navigation steps; it is not a database offset. Clear it with the cursor when query settings change. The web interface accepts only page sizes 10, 25, 50, and 100. Other route values use 50 and return to the first page. Support reloads, shared links, and browser Back and Forward through this URL state.

Each request uses the current database state. Do not preserve a fixed snapshot between requests. Continue from the encoded position if its record was removed. First clears the cursor and loads the latest records in the selected order.

Infer the opposite page from the cursor direction instead of querying for it. A `next` cursor means a previous page is available; a `previous` cursor means a next page is available. Fetch one extra row to check for another page in the requested direction. If matching records change, the inferred page can be empty. Keep inclusive recovery cursors for empty pages and the First control to restart navigation.
