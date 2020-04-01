<#-- 智能模拟数据记载，请勿注释或删除 -->
<#if !cdnBaseUrl??><#include "../fakeData/login.ftl"></#if>
<#include "../inc/core.ftl">
<#import "../lib/doc.ftl" as doc>
<#assign cdnBaseUrl = cdnBaseUrl!"/">
<@userPower list=loginPlatformAdminPower />
<@htmHead title="新建活动方案"
	keywords=""
	description=""
		css=["platformv3/css/login.css","platformv3/css/calendar.css","platformv3/css/doc.css"]
	    js=["platformv3/js/jquery-1.4.2.js","platformv3/js/easyCore.js","platformv3/js/jquery.mockjax.js","platformv3/js/calendar.js",
            "platformv3/js/jifen.js"]
    clean=true
     />
<@doc.top "marketing" />
<div class="main doc-body">
    <@doc.menu "marketing", "activity_scheme_info" />
    <div class="content content-1 doc-content">
            <form id="form1" action="/platformJifenManage/addScheme.htm" method="POST">
            <h3>填写方案基本信息</h3>
            <ul class="useTableList">
                <li>
                    <span class="required">方案名称：</span>
                    <em>
                        <input class="input" type="text" name="schemeCreateForm.schemeName">
                    </em>
                </li>
                <li>
                    <span class="required">方案类型：</span>
                    <em class="mockSelect">
                        <div class="front"></div>
                            <ul>
                                 <li data-value="HONGBAO">红包</li>
                                 <li data-value="POINTS">积分</li>
                                 <li data-value="MANJIAN">满减</li>
                                 <li data-value="DISCOUNT">打折</li>
                                 <li data-value="SPECIAL_HONGBAO">特殊红包</li>
                            </ul>
                        <input type="hidden" name="schemeCreateForm.schemeType">
                    </em>
                </li>
                <li>
                    <span>方案描述：</span>
                    <em>
                        <input class="input" type="text" name="schemeCreateForm.schemeDesc">
                    </em>
                </li>
                <li>
                    <span class="required">方案发行方：</span>
                    <em>
                         <input class="input" type="text" name="schemeCreateForm.issuer">
                    </em>
                </li>
                <li>
                    <span>优惠券名称：</span>
                    <em>
                        <input class="input" type="text" name="schemeCreateForm.couponName">
                    </em>
                </li>
                <li>
                    <span>提前通知天数：</span>
                    <em>
                        <input class="input" type="text" name="schemeCreateForm.noticeDays">
                    </em>
                </li>
                <li>
                    <span>通知方式：</span>
                    <em>
                        <input type="checkbox" name="schemeCreateForm.ifUseMail" value="true">&nbsp;邮件通知&nbsp;&nbsp;
                        <input type="checkbox" name="schemeCreateForm.ifUseSms" value="true">&nbsp;短信通知&nbsp;
                    </em>
                </li>
                <li>
                    <span>派发方式：</span>
                    <em>
                        <input type="radio" checked="checked" name="schemeCreateForm.distributeType" value="INTERFACE">&nbsp;接口派发&nbsp;&nbsp;
                        <input type="radio" name="schemeCreateForm.distributeType" value="ON_CHECKOUT">&nbsp;支付时派发(全场活动)&nbsp;
                    </em>
                </li>
                <li>
                    <span class="required">方案生效时间：</span>
                    <em>
                        <input class="input input-1" id="calendar1" autocomplete="off" type="text">
                        <input class="input input-2" id="time1" type="text" value="00:00:00">
                        <input type="hidden" id="openTime" name="schemeCreateForm.openTime">
                    </em>
                </li>
                <li>
                    <span class="required">方案失效时间：</span>
                    <em>
                        <input class="input input-1" id="calendar2" autocomplete="off" type="text">
                        <input class="input input-2" id="time2" type="text" value="00:00:00">
                        <input type="hidden" id="closeTime" name="schemeCreateForm.closeTime">
                    </em>
                </li>
                <li>
                    <span>备注：</span>
                    <em>
                        <textarea name="schemeCreateForm.remark"></textarea>
                    </em>
                </li>
            </ul>
            <h3>设置方案规则</h3>
            <ul class="useTableList" id="setRuleList">
                <li class="setRule">
                    <span data-index=1>规则1：</span>
                    <select class="verify" name="schemeCreateForm.rules[0].ruleType">
                                <option value="">请选择</option>
                        <#if ruleTypes?exists>
                            <#list ruleTypes?keys as key>
                                <option value=${key!""}>${ruleTypes.get(key)!"请选择"}</option>
                  			</#list>
               			</#if>
                    </select>
                    <select class="ruleName" name="schemeCreateForm.rules[0].ruleName">
                    </select>
                    <input class="input input-3" type="text" name="schemeCreateForm.rules[0].ruleValue">
                    <span class="cyan delete">删除</span>
                </li>
            </ul>
            <div class="cyan cyan-1">
                <div id="addRule"><del class="cross"></del><span>添加规则</span></div>
            </div>
            <div class="operations">
               <input type="submit" class="orangeBtn32" value="确定">
               <a href="/platformJifenManage/schemeInfo.htm" class="orangeBtn32">返回</a>
            </div>
        </form>
        <#-- 为设置方案规则而写 -->
            <ul id="invisible">
                <li class="setRule">
                    <span></span>
                    <select class="verify" name="schemeCreateForm.rules[0].ruleType">
                                <option value="">请选择</option>
                        <#if ruleTypes?exists>
                            <#list ruleTypes?keys as key>
                                <option value=${key!""}>${ruleTypes.get(key)!"请选择"}</option>
                  			</#list>
               			</#if>
                    </select>
                    <select class="ruleName" name="schemeCreateForm.rules[0].ruleName">
                    </select>
                    <input class="input input-3" type="text" name="schemeCreateForm.rules[0].ruleValue">
                    <span class="cyan delete">删除</span>
                </li>
            </ul>
    </div>
</div>
<div id="docFoot">
<@footerCom />
</div>
<script>
(function($){
    $('.mockSelect').mockSelect();
    $('.verify').setRuleFunc({url:'/platformJifenManage/getRuleNameAjax.htm'});
    $('.ruleName').setRuleFunc({url:'/platformJifenManage/getRuleDescAjax.htm'});
    $('#calendar1,#calendar2').click(function(event){
      $(this).Calendar();
      event.stopPropagation();
      });
    $(document).click(function(event){
        $.Calendar.hide();
    });
    $('#form1').submit(function(event){
    	$('#openTime').val($("#calendar1").val()+" "+$("#time1").val());
		$('#closeTime').val($("#calendar2").val()+" "+$("#time2").val());
    });
})(jQuery);
</script>
<@doc.customer_service />
<@doc.ga />
