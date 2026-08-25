from flask import current_app, request


def page_args():
    default_size = current_app.config["DEFAULT_PAGE_SIZE"]
    max_size = current_app.config["MAX_PAGE_SIZE"]
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = int(request.args.get("per_page", default_size))
    except (TypeError, ValueError):
        per_page = default_size
    return page, min(max(per_page, 1), max_size)


def paginate(query, schema):
    page, per_page = page_args()
    result = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": schema.dump(result.items, many=True),
        "meta": {
            "page": result.page,
            "per_page": result.per_page,
            "total": result.total,
            "pages": result.pages,
            "has_next": result.has_next,
            "has_prev": result.has_prev,
        },
    }