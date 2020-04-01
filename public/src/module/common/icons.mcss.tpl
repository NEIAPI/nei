/**
  * nei icons sprite
  */
[class^="u-icon-"], [class*=" u-icon-"] {
  display: inline-block;
  overflow: hidden;
  text-indent: -9999px;
  text-align: left;
  vertical-align: middle;
  background-repeat: no-repeat;
}

{%- for icon in icons %}
.u-icon-{{icon.name}} {
  background-image: url('{{icon.url}}?sprite!');
  width: {{icon.width}};
  height: {{icon.height}};
}
{% endfor %}
