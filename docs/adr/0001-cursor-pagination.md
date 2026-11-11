# Use cursor pagination for explorer lists

Use cursor pagination for the block, blob, and transaction lists, including the address page transaction list. The server returns a versioned, URL-safe cursor token that the client sends unchanged in later requests. Keep the token structure internal to the server so clients do not depend on the fields that define a position.

Use First, Previous, and Next controls. Remove page-number entry and the Last control because direct page jumps do not follow from a cursor position.

Remove the `p` request parameter and reject requests that include it with a clear error. Update the web interface in the same release. Keep `ps` for page size and keep total counts optional through `count`. The web interface uses cursor information to control navigation and does not request totals for pagination.

Return a `pagination` object with `nextCursor` and `previousCursor`. Each token includes its direction, so both use the same `cursor` request parameter. Use `null` when no page exists in a direction.

Keep the default page size at 50. Accept only integer values from 1 to 100 for `ps`. Reject values outside this range.

Do not include a query hash in the cursor. Clients must start with the first page when the resource, filters, or sort order change. The web interface clears the cursor when filters, sort order, or page size change. The server still checks the token structure and position values.

Store `cursor` and `ps` in the web page URL. Support reloads, shared links, and browser Back and Forward through this URL state.

Each request uses the current database state. Do not preserve a fixed snapshot between requests. Continue from the encoded position if its record was removed. First clears the cursor and loads the latest records in the selected order.
