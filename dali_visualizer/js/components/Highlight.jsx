function create_word_element(word, memory, abstraction, threshold) {
        // if score if greater than threshold we highlight it
        // modulate intensity later
        var classes = "word", inner_html = word, background_color = 'rgb(255, 251, 78)';
        if (memory > threshold) {
                classes += " highlight";
        } else {
                background_color = 'rgba(255, 251, 78, ' + memory * 0.7 + ")";
        }
        if (abstraction > threshold) {
                inner_html += "<div class='word memorized'>" + word + "<div class='dotted_vertical_line'></div></div>";
        } else {
                inner_html += "<div class='word memorized' style='opacity:"+ abstraction * 0.7 +"'>" + word + "</div>";
        }
        return "<span style='background-color:"+background_color+"' class='" + classes + "'>" + inner_html + "</span>";
}

function show_distribution(distribution, labels, ylabel, xlabel, rgb) {
        var distribution_table = "<table class='prediction-table'><tbody>";
        distribution_table += create_distribution_rows(distribution, labels, ylabel, xlabel, rgb).join("");
        distribution_table += "</tbody></table>";
        return distribution_table;
}

function create_distribution_rows(distribution, labels, ylabel, xlabel, rgb) {
        var base_color = d3.rgb(rgb[0], rgb[1], rgb[2]);
        var lighter_version = base_color.hsl(),
                darker_version = base_color.hsl();
        lighter_version.l = 1.0;
        darker_version.l = 0.1;
        var interpolator = d3.interpolateHsl(lighter_version, darker_version);

        var rows = [], row;
        for (var i = 0;i< distribution[0].length;++i) {
                row = "<tr>";
                row += "<td class='table-label'>" + labels[i] + "</td>";
                for (var j = 0; j < distribution.length;++j) {
                        row += "<td style='background-color:"+ interpolator(distribution[j][i])+"'></td>";
                }
                // add ylabel:
                if (i === 0) row += "<td rowspan=" + distribution[0].length + "><div class='ylabel'><span>" + ylabel + "</span></div></td>";

                row += "</tr>";
                rows.push(row);
        }
        rows.push("<tr><td></td><td colspan=" + distribution.length +"><div class='xlabel' ><span>"  + xlabel + "</span></div></td></tr>");

        return rows;
}

function show_distribution_words(divid, composition_size, text_sequence, threshold, memories, abstractions, distribution, labels, ylabel, xlabel, rgb) {
        var el = document.getElementById(divid);
        el.innerHTML = create_distribution_words(composition_size, text_sequence, threshold, memories, abstractions, distribution, labels, ylabel, xlabel, rgb);
}

function create_distribution_words(composition_size, text_sequence, threshold, memories, abstractions, distribution, labels, ylabel, xlabel, rgb) {

        var distribution_table = "<table class='prediction-table'><tbody>",
                highlights = create_highlights(text_sequence, threshold, memories, abstractions),
                rows = create_distribution_rows(distribution, labels, ylabel, xlabel, rgb);

        var word_row = "<tr><td style='text-align:right'>" + highlights.slice(0, composition_size-1).join("<span> </span>") + "</td>";

        for (var i = composition_size - 1; i < highlights.length; ++i ) {
                word_row += "<td>" + highlights[i] + "</td>";
        }
        word_row += "</tr>";
        rows.unshift(word_row);
        distribution_table += rows.join("") + "</tbody></table>";
        return distribution_table;
}

function show_distribution_words_procedural(element_id, composition_size, text_sequence, threshold, memories, abstractions, distribution, labels, ylabel, xlabel, rgb) {

        var selector = "<select>";

        for (var i = 0; i < distribution.length + 1;i++) {
                selector += "<option value=" + i + ">Step "+i+"</option>";
        }

        selector += "</select>";
        var el = document.getElementById(element_id);
        el.innerHTML += "<div></div>";
        el.innerHTML += selector;

        var selector_el = el.childNodes[1];
        var container_el = el.childNodes[0];


        function create_distribution_for_step(step) {

                // create copies of data:
                var temp_memories = memories.slice(0),
                        temp_abstractions = abstractions.slice(0),
                        j, k;

                var temp_distribution = [];
                for (j = 0; j < distribution.length;j++) {
                        temp_distribution.push(distribution[j].slice(0));
                }


                // then set zones beyond the step to 0:
                for (j = step; j < temp_distribution.length;j++) {
                        for (k = 0; k <temp_distribution[0].length;k++) {
                                temp_distribution[j][k] = 0.0;
                        }
                        temp_memories[j + composition_size - 1] = 0.0;
                        temp_abstractions[j] = 0.0;
                }

                return create_distribution_words(composition_size, text_sequence, threshold,
                        temp_memories,
                        temp_abstractions, temp_distribution, labels, ylabel, xlabel, rgb);
        }

        selector_el.addEventListener('change', function (event) {
                container_el.innerHTML = create_distribution_for_step(parseInt(this.value));
        });

        container_el.innerHTML = create_distribution_for_step(0);
}

function create_highlights (text_sequence, threshold, memories, abstractions) {
        var elements = [], i;
        for (i = 0; i < memories.length;i++) {
                elements.push(
                        create_word_element(text_sequence[i], memories[i], abstractions[i], threshold)
                        );
        }
        return elements;
}

function show_highlights(text_sequence, threshold, memories, abstractions) {
        return "<div>" + create_highlights(text_sequence, threshold, memories, abstractions).join("<span> </span>") + "</div>";
}

function apply_highlights(element_id, element_text) {
        var el = document.getElementById(element_id);
        el.innerHTML += element_text;
}


