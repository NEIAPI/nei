<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>icons</title>
    <link href="./icons.css" rel="stylesheet"/>
</head>
<body style="background-color: #333;">
{%- for icon in icons %}
<div class="u-icon-{{icon.name}}" title="u-icon-{{icon.name}}"></div>
{%- endfor %}
</body>
</html>