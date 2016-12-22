$(function () {
    window.register_dmmd_preview = function ($preview) {
        var $update = $preview.find('.dmmd-preview-update');
        var $content = $preview.find('.dmmd-preview-content');
        var preview_url = $preview.attr('data-preview-url');
        var $textarea = $('#' + $preview.attr('data-textarea-id'));

        $update.click(function () {
            var text = $textarea.val();
            if (text) {
                $.post(preview_url, {
                    preview: text,
                    csrfmiddlewaretoken: $.cookie('csrftoken')
                }, function (result) {
                    $content.html(result);
                    $preview.addClass('dmmd-preview-has-content');

                    var $jax = $content.find('.require-mathjax-support');
                    if ($jax.length) {
                        if (!('MathJax' in window)) {
                            $.ajax({
                                type: 'GET',
                                url: $jax.attr('data-config'),
                                dataType: 'script',
                                cache: true,
                                success: function () {
                                    $.ajax({
                                        type: 'GET',
                                        url: '//cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML',
                                        dataType: 'script',
                                        cache: true,
                                        success: function () {
                                            MathJax.Hub.Queue(function () {
                                                $content.find('.tex-image').hide();
                                                $content.find('.tex-text').show();
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            MathJax.Hub.Queue(['Typeset', MathJax.Hub, $content[0]], function () {
                                $content.find('.tex-image').hide();
                                $content.find('.tex-text').show();
                            });
                        }
                    }
                });
            } else {
                $content.empty();
                $preview.removeClass('dmmd-preview-has-content');
            }
        }).click();

        var timeout = $preview.attr('data-timeout');
        var last_event = null;
        if (timeout) {
            $textarea.on('keyup', function () {
                if (last_event)
                    clearTimeout(last_event);
                last_event = setTimeout(function () {
                    $update.click();
                    last_event = null;
                }, timeout);
            });
        }
    };

    $('.dmmd-preview').each(function () {
        register_dmmd_preview($(this));
    });

    if ('django' in window && 'jQuery' in window.django)
        django.jQuery(document).on('formset:added', function(event, $row) {
            var $preview = $row.find('.dmmd-preview');
            if ($preview.length) {
                var id = $row.attr('id');
                id = id.substr(id.lastIndexOf('-') + 1);
                $preview.attr('data-textarea-id', $preview.attr('data-textarea-id').replace('__prefix__', id));
                register_dmmd_preview($preview);
            }
        });
});
